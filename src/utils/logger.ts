export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] ℹ️  ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.context}] ❌ ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`  Error: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  }

  warn(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [${this.context}] ⚠️  ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${this.context}] 🔍 ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  success(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] ✅ ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}
