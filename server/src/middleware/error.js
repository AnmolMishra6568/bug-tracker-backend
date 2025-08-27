export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  const code = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(code).json({
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}
