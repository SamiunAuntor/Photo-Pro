export type RemovalProgress = {
  percentage?: number;
  message?: string;
};

export class BackgroundRemovalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackgroundRemovalError";
  }
}
