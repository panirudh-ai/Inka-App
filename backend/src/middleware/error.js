export function notFound(_req, _res, next) {
  const err = new Error("Route not found");
  err.status = 404;
  next(err);
}

export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  if (err.code === "23505") {
    status = 409;
    message = "Duplicate record. Value already exists.";
  } else if (err.code === "23503") {
    status = 409;
    message = "Cannot complete operation because this record is referenced.";
  } else if (err.code === "22P02") {
    status = 400;
    message = "Invalid input format.";
  }

  res.status(status).json({
    error: message,
  });
}
