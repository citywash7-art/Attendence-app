module.exports = (err, req, res, next) => {
  let status = err.status || 500;
  if (err.name === 'MulterError') status = 400;

  const payload = { message: err.message || 'Server error' };
  if (err.details) payload.details = err.details;

  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json(payload);
};
