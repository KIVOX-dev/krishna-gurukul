/** Extra copy for each course type, shown on the Courses and Course detail pages. */
export interface CourseCopy {
  tagline: string;
  learns: string[];
  who: string;
  format: string[];
  outcome: string;
}

export const COURSE_COPY: Record<string, CourseCopy> = {
  abacus: {
    tagline: 'Fast, confident mental maths',
    learns: ['Quick and accurate mental calculation', 'Strong concentration and memory', 'Picturing numbers on an imaginary abacus', 'Confidence with school maths'],
    who: 'Children aged 5 to 14, from complete beginners to those who want to get faster.',
    format: ['Weekly classes in small, level-based batches', 'Daily practice games to build speed', 'Regular tests with instant results and feedback', 'Level certificates as children progress'],
    outcome: 'Children calculate faster, focus longer and enjoy maths.',
  },
  vedic: {
    tagline: 'Ancient shortcuts for modern exams',
    learns: ['Shortcut methods for squares, multiplication and division', 'Quick ways to check answers', 'Number patterns and divisibility tricks', 'Less fear of maths'],
    who: 'Children aged 9 to 16 who want speed and accuracy in school and competitive exams.',
    format: ['Concept-first lessons with plenty of examples', 'Timed practice sets', 'Doubt-clearing time in every class', 'Progress reports for parents'],
    outcome: 'Students solve long sums in seconds and enjoy the logic behind them.',
  },
  tuition: {
    tagline: 'Caring help with school subjects',
    learns: ['Clear explanations of school lessons', 'Regular revision and weekly tests', 'Homework support and exam preparation', 'Good study habits and time management'],
    who: 'Students from Class 1 to Class 10 who need steady, personal support.',
    format: ['Small groups so every child gets attention', 'Class-wise and subject-wise planning', 'Monthly tests with feedback to parents', 'Open door to talk to the teacher'],
    outcome: 'Better understanding, better marks and a calmer child at exam time.',
  },
  music: {
    tagline: 'Sing with confidence and joy',
    learns: ['Sarali varisai, janta varisai and alankarams', 'Voice culture and a steady sense of shruti', 'Simple geethams and kritis', 'Confidence to sing in front of others'],
    who: 'Children and adults from 6 years upward, with no experience needed.',
    format: ['Gentle weekly lessons with a patient teacher', 'Step-by-step grades', 'Practice recordings to learn from', 'Chances to perform at events'],
    outcome: 'A strong foundation in Carnatic music and a lifelong love for it.',
  },
};

export const copyFor = (type?: string): CourseCopy => COURSE_COPY[type ?? ''] ?? COURSE_COPY.abacus;
