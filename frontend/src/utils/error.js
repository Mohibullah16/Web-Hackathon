export function getErrorMessage(error, fallback = 'Something went wrong') {
  try {
    if (!error) return fallback;
    // Axios-style error
    const data = error.response?.data ?? error.data ?? error;
    const detail = data?.detail ?? data?.message ?? data?.error;

    if (!detail) {
      // Fallback to status text or message
      return (
        error.response?.statusText || error.message || fallback
      );
    }

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
      // Pydantic v2 validation error array
      const parts = detail
        .map((d) => {
          if (!d) return null;
          if (typeof d === 'string') return d;
          if (typeof d === 'object') {
            const path = Array.isArray(d.loc) ? d.loc.join('.') : d.loc;
            return [path, d.msg].filter(Boolean).join(': ');
          }
          return null;
        })
        .filter(Boolean);
      return parts.join('; ') || fallback;
    }

    if (typeof detail === 'object') {
      // Try common shapes
      if (detail.msg) return detail.msg;
      if (detail.message) return detail.message;
      return JSON.stringify(detail);
    }

    // Anything else
    return String(detail);
  } catch (e) {
    return fallback;
  }
}
