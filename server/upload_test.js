const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

(async () => {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream('server/test_upload.pdf'));
    form.append('userId', 'persona-4');

    const headers = form.getHeaders();
    const opts = {
      method: 'POST',
      headers,
      host: 'localhost',
      port: 3001,
      path: '/api/upload'
    };

    const req = http.request(opts, (res) => {
      console.log('status', res.statusCode);
      let body = '';
      res.on('data', (c) => (body += c.toString()));
      res.on('end', () => console.log(body));
    });

    form.pipe(req);
    req.on('error', (e) => {
      console.error('request error', e);
      process.exit(1);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
