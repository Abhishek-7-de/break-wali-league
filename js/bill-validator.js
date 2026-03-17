window.CBCL_BILL = ((config) => {
  const formatBillInput = (value) => {
    const digits = String(value).replace(/\D/g, '').slice(0, 12);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    if (digits.length > 8) parts.push(digits.slice(8, 12));
    return parts.join('/');
  };

  const isValid = (value) => config.billPattern.test(String(value).trim());

  return { formatBillInput, isValid };
})(window.CBCL_CONFIG);