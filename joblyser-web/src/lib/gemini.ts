export const analyzeJob = async (jdText: string, resumeText: string, action: string) => {
  return new Promise<{ analysis: any; content: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        analysis: {
          match: 85,
          strengths: ["React", "TypeScript"],
          gaps: ["GraphQL"],
        },
        content: `Analysis for action: ${action}\n\nBased on your JD and resume...`,
      });
    }, 1500);
  });
};

export const refineContent = async (content: string, query: string) => {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(`${content}\n\n[Refined with query: ${query}]`);
    }, 1000);
  });
};
