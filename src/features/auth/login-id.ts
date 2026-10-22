// Wajib identik dengan Edge Function admin-members dan kolom generated profiles.login_id.
export const toLoginId = (input: string): string =>
	input.replace(/[^A-Za-z0-9]/g, '').toLowerCase();

// Domain dioper pemanggil: klien memakai VITE_AUTH_EMAIL_DOMAIN, skrip memakai AUTH_EMAIL_DOMAIN.
export const toAuthEmail = (input: string, domain: string): string =>
	`${toLoginId(input)}@${domain}`;
