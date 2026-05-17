/*
Utilidad compartida para imprimir un código de barras en
una ventana emergente. Usada en GestionLlaves, GestionUsuarios.
*/
import JsBarcode from 'jsbarcode';

/**
 * Abre una ventana de impresión con el código de barras generado.
 * @param {string} codigo
 * @param {string} etiqueta
 * @param {number} tamano
 */
export const imprimirCodigo = (codigo, etiqueta = '', tamano = 400) => {
  if (!codigo) return;

  const tamanoValidado = Math.max(100, Math.min(1000, parseInt(tamano, 10) || 400));

  const ancho = 600;
  const alto = 400;
  const izquierda = Math.round((window.screen.width - ancho) / 2);
  const superior = Math.round((window.screen.height - alto) / 2);

  const ventana = window.open(
    '',
    '_blank',
    `width=${ancho},height=${alto},top=${superior},left=${izquierda}`
  );
  if (!ventana) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, codigo, {
    format: 'CODE128',
    width: 2,
    height: 80,
    fontSize: 14,
    background: '#ffffff',
    displayValue: true,
  });

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Imprimir Código — ${codigo}</title>
        <style>
          @page { margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 98vh;
            font-family: 'Courier New', Courier, monospace;
            background: #fff;
          }
          .print-container { 
            text-align: center; 
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
          }
          svg { 
            width: ${tamanoValidado}px; 
            max-width: 100%; 
            height: auto;
            display: block;
          }
          .code-text { 
            margin-top: 5px; 
            font-size: 16px; 
            color: #333;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${svg.outerHTML}
          <div class="code-text">${etiqueta}</div>
        </div>
        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  ventana.document.close();
};
