/** Same-tab navigation, in one place so tests can replace it. */
export function navigate(url: string): void {
  window.location.assign(url);
}
