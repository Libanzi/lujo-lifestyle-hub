import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface LogEntry {
  function_name: string;
  execution_time_ms?: number;
  status: 'success' | 'error' | 'timeout';
  error_message?: string;
  user_id?: string;
  request_method?: string;
  request_path?: string;
  response_status?: number;
  metadata?: Record<string, any>;
}

export class FunctionLogger {
  private supabase: SupabaseClient;
  private functionName: string;
  private startTime: number;

  constructor(functionName: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.functionName = functionName;
    this.startTime = Date.now();
  }

  async logSuccess(data: Partial<LogEntry> = {}) {
    const executionTime = Date.now() - this.startTime;
    await this.log({
      status: 'success',
      execution_time_ms: executionTime,
      response_status: data.response_status || 200,
      ...data,
    });
  }

  async logError(error: Error | string, data: Partial<LogEntry> = {}) {
    const executionTime = Date.now() - this.startTime;
    const errorMessage = error instanceof Error ? error.message : error;
    await this.log({
      status: 'error',
      execution_time_ms: executionTime,
      error_message: errorMessage,
      response_status: data.response_status || 500,
      ...data,
    });
  }

  private async log(entry: Partial<LogEntry>) {
    try {
      await this.supabase.from('function_logs').insert({
        function_name: this.functionName,
        ...entry,
      });
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }
}

// Email rate limiting helper
export async function checkAndRecordEmailLimit(
  userId: string | undefined,
  emailType: string,
  recipientEmail: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!userId) {
    return { allowed: true }; // System emails without user context bypass rate limit
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check rate limit
  const { data: canSend, error: checkError } = await supabase.rpc(
    'check_email_rate_limit',
    {
      p_user_id: userId,
      p_email_type: emailType,
      p_max_per_hour: 5,
      p_max_per_day: 20,
    }
  );

  if (checkError) {
    console.error('Error checking email rate limit:', checkError);
    return { allowed: true }; // Fail open to not block legitimate emails
  }

  if (!canSend) {
    return {
      allowed: false,
      reason: 'Email rate limit exceeded. Maximum 5 emails per hour or 20 per day.',
    };
  }

  // Record the email send
  const { error: recordError } = await supabase.rpc('record_email_send', {
    p_user_id: userId,
    p_email_type: emailType,
    p_recipient_email: recipientEmail,
  });

  if (recordError) {
    console.error('Error recording email send:', recordError);
  }

  return { allowed: true };
}
