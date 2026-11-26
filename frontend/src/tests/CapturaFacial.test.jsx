// T037 - Pruebas del componente reutilizable de captura facial.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CapturaFacial from '../components/CapturaFacial.jsx';
import {
  abrirCamara,
  capturarDescriptor,
  detenerCamara,
} from '../facerecognition/descriptor.js';

vi.mock('../facerecognition/descriptor.js', () => ({
  abrirCamara: vi.fn(),
  capturarDescriptor: vi.fn(),
  detenerCamara: vi.fn(),
  dibujarGuia: vi.fn(),
}));

const descriptor = Array.from({ length: 128 }, (_, indice) => indice / 128);

async function iniciarCamara() {
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar cámara' }));
  expect(await screen.findByRole('button', { name: 'Detener cámara' })).toBeInTheDocument();
}

beforeEach(() => {
  vi.mocked(abrirCamara).mockReset().mockResolvedValue({ getTracks: () => [] });
  vi.mocked(capturarDescriptor).mockReset().mockResolvedValue(descriptor);
  vi.mocked(detenerCamara).mockReset();
});

describe('CapturaFacial', () => {
  it('entrega el descriptor capturado y muestra la confirmación', async () => {
    const onCaptura = vi.fn();

    render(<CapturaFacial onCaptura={onCaptura} etiquetaBoton="Validar acceso" />);
    await iniciarCamara();
    fireEvent.click(screen.getByRole('button', { name: 'Validar acceso' }));

    await waitFor(() => expect(onCaptura).toHaveBeenCalledWith(descriptor));
    expect(screen.getByText('Rostro capturado correctamente.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Intentos: 0 de 3');
  });

  it('limita los reintentos y deshabilita la captura al agotarlos', async () => {
    vi.mocked(capturarDescriptor).mockResolvedValue(null);
    const onCaptura = vi.fn();

    render(<CapturaFacial onCaptura={onCaptura} maxIntentos={2} />);
    await iniciarCamara();

    fireEvent.click(screen.getByRole('button', { name: 'Capturar rostro' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Intento 1 de 2');

    fireEvent.click(screen.getByRole('button', { name: 'Capturar rostro' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Se alcanzó el máximo de 2 intentos'
    );
    expect(screen.getByRole('button', { name: 'Capturar rostro' })).toBeDisabled();
    expect(onCaptura).not.toHaveBeenCalled();
  });

  it('muestra un mensaje claro cuando falla la cámara', async () => {
    vi.mocked(abrirCamara).mockRejectedValue(
      new Error('No se pudo acceder a la cámara. Verifique los permisos del navegador.')
    );

    render(<CapturaFacial onCaptura={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar cámara' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo acceder a la cámara. Verifique los permisos del navegador.'
    );
  });
});
