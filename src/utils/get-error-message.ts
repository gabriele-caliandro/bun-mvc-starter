type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return typeof error === "object" && error !== null && "message" in error && typeof (error as Record<string, unknown>).message === "string";
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  // Case an error is: { message: string }
  if (isErrorWithMessage(maybeError)) {
    console.log(`Erorr is with message`);
    return maybeError;
  }

  try {
    const jsonString = JSON.stringify(maybeError, null, 2);
    console.log(jsonString);
    return new Error(jsonString);
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    const stringError = String(maybeError);
    console.log(stringError);
    return new Error(stringError);
  }
}

export function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}
