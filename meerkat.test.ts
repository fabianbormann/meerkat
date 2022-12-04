import Meerkat from './meerkat';

describe('testing meerkat', () => {
  test('create a new meerkat instance a throwing any error', (done) => {
    const meerkat = new Meerkat();

    let connected = false;
    meerkat.on('connections', (clients) => {
      if (clients == 0 && connected == false) {
        connected = true;
        console.log('[info]: server ready');
        console.log(
          `[info]: The address of this meerkat is ${meerkat.address()}`
        );
      }
      console.log(`[info]: ${clients} clients connected`);

      expect(clients.toBe(0));
      done();
    });
  }, 30000);
});
