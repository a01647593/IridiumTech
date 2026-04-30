import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument();
const outPath = './server/test_upload.pdf';
const stream = fs.createWriteStream(outPath);

doc.pipe(stream);

doc.fontSize(20).text('Prueba de PDF para extracción', { align: 'center' });

doc.moveDown();

doc.fontSize(12).text('Este PDF contiene texto de ejemplo que el asistente debe extraer y procesar.');

doc.moveDown();

for (let i = 0; i < 5; i++) {
  doc.text(`Párrafo ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. ` +
    'Phasellus vehicula, justo at congue convallis, urna mauris luctus nisl, sed ' +
    'malesuada urna magna vitae orci.');
  doc.moveDown();
}

doc.end();

stream.on('finish', () => {
  console.log('PDF creado en', outPath);
});
