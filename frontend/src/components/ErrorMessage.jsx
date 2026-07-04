function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger-500/20 bg-danger-500/5 px-6 py-10 text-center">
      <p className="text-sm font-medium text-danger-600">
        {message || "Something went wrong."}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-danger-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-danger-500"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
