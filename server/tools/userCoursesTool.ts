import { getUserCourses } from '../supabase.js';

/**
 * A callable tool object compatible with the GenAI SDK automatic function calling loop.
 * It exposes a function declaration for `getUserCourses` and implements `callTool`.
 */
export default class UserCoursesTool {
  async tool() {
    return {
      functionDeclarations: [
        {
          name: 'getUserCourses',
          description: 'Devuelve la lista de cursos asignados (activos) para un usuario dado.',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'ID del usuario en Supabase' }
            },
            required: ['userId']
          }
        }
      ]
    };
  }

  async callTool(functionCalls: any[] = []) {
    // Expecting an array of function call objects; process the first one.
    if (!functionCalls || functionCalls.length === 0) return [];
    const call = functionCalls[0];
    let args: any = {};
    try {
      if (typeof call.arguments === 'string') {
        args = JSON.parse(call.arguments || '{}');
      } else {
        args = call.arguments || {};
      }
    } catch (err) {
      // malformed args
      args = {};
    }

    const userId = args.userId ?? args.user_id ?? '';
    if (!userId) return ['[]'];

    try {
      const courses = await getUserCourses(String(userId));
      // Return a single text part containing JSON string of courses (model will receive it as tool response)
      return [JSON.stringify({ courses }, null, 2)];
    } catch (err: any) {
      return [JSON.stringify({ error: err?.message ?? String(err) })];
    }
  }
}
