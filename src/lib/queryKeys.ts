export const queryKeys = {
    templates: () => ['templates'] as const,
    template: (id: string) => ['template', id] as const,
    exercises: () => ['exercises'] as const,
    histories: () => ['histories'] as const,
}


