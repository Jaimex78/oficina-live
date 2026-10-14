import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AvisosProvider } from './componentes/Avisos';
import { MarcaProvider } from './estado/marca';
import { SesionProvider } from './estado/sesion';
import { TemaProvider } from './estado/tema';
import './estilos/base.css';
import './estilos/componentes.css';
import './estilos/ingreso.css';
import './estilos/shell.css';
import './estilos/admin.css';
import './estilos/mundo.css';
import './estilos/hud.css';
import './estilos/editor.css';
import './estilos/planner.css';
import './estilos/personaje.css';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('No se encontró #root');

createRoot(raiz).render(
  <StrictMode>
    <TemaProvider>
      <MarcaProvider>
        <AvisosProvider>
          <SesionProvider>
            <App />
          </SesionProvider>
        </AvisosProvider>
      </MarcaProvider>
    </TemaProvider>
  </StrictMode>,
);
