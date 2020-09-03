import { Closeable, startServer } from './server';
import { promisify } from 'util';
import { get } from 'http';

const delay = promisify(setTimeout);

function callServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = get('http://localhost:3000/', (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Unexpected response code ${res.statusCode}`));
      }
    });
    request.on('error', reject);
    request.end();
  });
}

describe('Server', () => {

  let server: Closeable | undefined;

  beforeAll(async () => {
    server = await startServer(3000);
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  it('limits according to default parameters', async () => {
    jest.setTimeout(10000); // Jest's fake timers don't work on process.hrtime
    await delay(2000); // wait some time before starting test
    // call 100 times to activate rate limiter;
    for (let i = 0; i < 100; i++) {
      await callServer();
      await delay(50);
    }
    await expect(callServer()).rejects.toThrowError('Unexpected response code 429');
  });

});
