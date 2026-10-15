import { GoogleGenAI, Type } from '@google/genai';

export interface PlanGenerationRequest {
  subjects: { name: string; examDate: string; priority?: string }[];
  difficultTopics: string;
  dailyHours: number;
  preferredStyle: string;
  weekendStudy: boolean;
  notes?: string;
}

export async function generateStudyTimetable(input: PlanGenerationRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the Settings > Secrets panel.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const promptText = `
You are FocusFlow AI, an elite academic advisor and cognitive science study strategist.
Analyze the following student details and generate an optimal, realistic, and highly motivating study timetable and task breakdown:

Student Study Profile:
- Subjects & Exam Deadlines: ${JSON.stringify(input.subjects)}
- Stated Difficult Topics / Weak Areas: "${input.difficultTopics || 'None specified'}"
- Daily Study Capacity: ${input.dailyHours} hours/day
- Preferred Study Technique: ${input.preferredStyle || 'Pomodoro (25m work / 5m break)'}
- Study on Weekends: ${input.weekendStudy ? 'Yes' : 'No'}
${input.notes ? `- Additional Student Context: "${input.notes}"` : ''}

Strategic Guidance:
1. Prioritize upcoming exam deadlines and topics marked difficult with spaced repetition and active recall.
2. Structure daily blocks to fit realistic cognitive fatigue cycles. Ensure proper interleaving (switching subjects to improve retention).
3. Provide concrete actionable study tasks that the student can directly import into their task board.
4. Set clear target milestones leading up to each subject's exam date.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: promptText,
    config: {
      systemInstruction: 'You are an expert cognitive learning specialist and study planner for students. Return structured JSON only.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          planTitle: {
            type: Type.STRING,
            description: 'Engaging, concise title for this personalized plan',
          },
          overview: {
            type: Type.STRING,
            description: 'Executive study strategy overview and motivational guidance',
          },
          dailySchedule: {
            type: Type.ARRAY,
            description: 'Timetable breakdown across the upcoming 7 days',
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING, description: 'e.g. Day 1 (Monday)' },
                date: { type: Type.STRING, description: 'YYYY-MM-DD format' },
                focusTheme: { type: Type.STRING, description: 'Core learning objective for the day' },
                totalHours: { type: Type.NUMBER, description: 'Total study hours for this day' },
                blocks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      startTime: { type: Type.STRING, description: 'e.g. 09:00 AM' },
                      endTime: { type: Type.STRING, description: 'e.g. 10:30 AM' },
                      subject: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      activity: { type: Type.STRING, description: 'Specific practice or reading task' },
                      durationMinutes: { type: Type.INTEGER },
                      breakMinutes: { type: Type.INTEGER },
                      studyTechnique: { type: Type.STRING, description: 'e.g. Active Recall, Feynman Technique, Practice Questions' },
                    },
                    required: ['startTime', 'endTime', 'subject', 'topic', 'activity', 'durationMinutes'],
                  },
                },
              },
              required: ['day', 'date', 'focusTheme', 'totalHours', 'blocks'],
            },
          },
          priorityActionItems: {
            type: Type.ARRAY,
            description: 'Specific immediate study tasks ready to add to the task board',
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subject: { type: Type.STRING },
                priority: { type: Type.STRING, description: 'Urgent, High, Medium, or Low' },
                estimatedMinutes: { type: Type.INTEGER },
                dueDate: { type: Type.STRING, description: 'YYYY-MM-DD' },
                reason: { type: Type.STRING },
              },
              required: ['title', 'subject', 'priority', 'estimatedMinutes', 'dueDate'],
            },
          },
          revisionMilestones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                milestone: { type: Type.STRING },
                targetDate: { type: Type.STRING },
                subject: { type: Type.STRING },
              },
              required: ['milestone', 'targetDate', 'subject'],
            },
          },
          studyTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['planTitle', 'overview', 'dailySchedule', 'priorityActionItems', 'studyTips'],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('AI returned an empty response. Please retry.');
  }

  try {
    return JSON.parse(responseText);
  } catch (err) {
    console.error('Failed to parse AI response JSON:', responseText);
    throw new Error('Could not parse generated study timetable. Please try again.');
  }
}
