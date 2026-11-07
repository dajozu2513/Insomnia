/** True while the 3D chain is (or may still be) showing; false once it has fallen back to photos. */
export function has3d(): boolean {
  return document.documentElement.classList.contains('has-3d');
}
