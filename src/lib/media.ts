export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function mediaErrorMessage(error: unknown, device: 'camera' | 'microphone'): { label: string; message: string } {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return { label: 'Permission blocked', message: `The browser did not provide ${device} access. Reset the site permission and try again.` };
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return { label: `No ${device} available`, message: `Connect or enable a ${device}, then retry.` };
  if (name === 'NotReadableError' || name === 'TrackStartError') return { label: `${device[0]?.toUpperCase()}${device.slice(1)} may be in use`, message: `Close other applications using the ${device} and try again.` };
  if (name === 'OverconstrainedError') return { label: 'Selected device unavailable', message: 'The selected device or requested setting is unavailable. Choose the default device and retry.' };
  return { label: 'Test could not start', message: `Reload the page, check the ${device}, and try again. No media was saved.` };
}

export function supportsSecureMedia(): boolean {
  return typeof window !== 'undefined' && (window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
}
