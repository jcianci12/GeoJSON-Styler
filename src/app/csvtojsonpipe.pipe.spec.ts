import { CSVtoJSONPipe } from './csvtojsonpipe';

describe('JsontocsvPipe', () => {
  it('create an instance', () => {
    const pipe = new CSVtoJSONPipe();
    expect(pipe).toBeTruthy();
  });
});
