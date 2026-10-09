import { createHash } from 'node:crypto';
import { DeviceClient, uploadFile } from './support/client';
import { createTestApp, type TestApp } from './support/test-app';

const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex');

async function waitForReport(client: DeviceClient, id: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const { body } = await client.get(`/reports/${id}`).expect(200);
    if (body.status !== 'processing') return body;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Report never finished processing');
}

describe('Reports (e2e)', () => {
  let t: TestApp;
  let client: DeviceClient;
  let reportId: string;
  const file = Buffer.from('%PDF-1.4 sample');

  beforeAll(async () => {
    t = await createTestApp();
    client = await new DeviceClient(t.app).onboard();
  });
  afterAll(() => t.close());

  it('extracts markers, explains flagged ones and adjusts the plan', async () => {
    const before = await client.get('/goals/plan').expect(200);
    expect(before.body.targets.fiberG).toBe(25);

    const fileKey = await uploadFile(client, 'report', 'application/pdf', file);
    const registered = await client
      .post('/reports', { fileKey, fileName: 'thyrocare.pdf', fileHash: sha256(file) })
      .expect(201);
    expect(registered.body.status).toBe('processing');
    reportId = registered.body.id;

    const report = await waitForReport(client, reportId);
    expect(report).toMatchObject({
      status: 'ready',
      labName: 'Sample Diagnostics',
      reportDate: '2026-09-02',
    });
    expect(report.watchCount).toBeGreaterThan(0);
    expect(report.markers[0].status).not.toBe('in_range');

    const ldl = report.markers.find((m: { code: string }) => m.code === 'ldl');
    expect(ldl).toMatchObject({ status: 'high', normalizedValue: 152 });
    expect(ldl.explanation.action).toContain('Fibre target raised to 30 g');

    const after = await client.get('/goals/plan').expect(200);
    expect(after.body.targets).toMatchObject({ fiberG: 30, saturatedFatMaxG: expect.any(Number) });
    expect(after.body.adjustments).toContain('fiber_raised_for_ldl');
  });

  it('detects a duplicate upload by hash', async () => {
    const fileKey = await uploadFile(client, 'report', 'application/pdf', file);
    const duplicate = await client
      .post('/reports', { fileKey, fileName: 'again.pdf', fileHash: sha256(file) })
      .expect(409);
    expect(duplicate.body).toMatchObject({ code: 'duplicate_report', details: { reportId } });
  });

  it('lets the user correct a value and add a missing one', async () => {
    const report = await client.get(`/reports/${reportId}`).expect(200);
    const ldl = report.body.markers.find((m: { code: string }) => m.code === 'ldl');
    const corrected = await client.patch(`/biomarkers/${ldl.id}`, { value: 110 }).expect(200);
    expect(corrected.body).toMatchObject({ status: 'in_range', needsConfirmation: false });

    const added = await client
      .post(`/reports/${reportId}/biomarkers`, { code: 'uric_acid', value: 8.1, unit: 'mg/dL' })
      .expect(201);
    expect(added.body).toMatchObject({ code: 'uric_acid', status: 'high' });

    const plan = await client.get('/goals/plan').expect(200);
    expect(plan.body.targets.saturatedFatMaxG).toBeNull();
  });

  it('shows flagged markers on Today', async () => {
    const today = await client.get('/today').expect(200);
    expect(today.body.flaggedMarkers.map((m: { code: string }) => m.code)).toEqual(
      expect.arrayContaining(['hba1c', 'vitamin_d']),
    );
  });

  it("does not reveal other users' reports", async () => {
    const other = await new DeviceClient(t.app).onboard();
    await other.get(`/reports/${reportId}`).expect(404);
    expect((await other.get('/reports').expect(200)).body).toEqual([]);
  });
});
