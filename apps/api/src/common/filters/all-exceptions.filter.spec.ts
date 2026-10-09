import { HttpStatus, NotFoundException, type ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AppException } from '../errors/app.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

function hostCapturing() {
  const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() };
  const host = {
    switchToHttp: () => ({ getResponse: () => reply }),
  } as unknown as ArgumentsHost;
  return { host, reply };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it.each([
    [AppException.notFound('Meal'), HttpStatus.NOT_FOUND, 'not_found'],
    [new NotFoundException(), HttpStatus.NOT_FOUND, 'not_found'],
    [new ThrottlerException(), HttpStatus.TOO_MANY_REQUESTS, 'rate_limited'],
    [
      Object.assign(new Error('Body too large'), { statusCode: 413 }),
      HttpStatus.PAYLOAD_TOO_LARGE,
      'payload_too_large',
    ],
  ])('maps %p to %i %s', (exception, status, code) => {
    const { host, reply } = hostCapturing();
    filter.catch(exception, host);
    expect(reply.status).toHaveBeenCalledWith(status);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ code }));
  });

  it('hides internals of unexpected errors', () => {
    const { host, reply } = hostCapturing();
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
    filter.catch(new Error('db password leaked'), host);
    expect(reply.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(reply.send).toHaveBeenCalledWith({
      code: 'internal_error',
      message: 'Something went wrong on our side.',
    });
  });
});
