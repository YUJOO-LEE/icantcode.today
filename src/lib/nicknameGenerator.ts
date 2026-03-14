import { MAX_NICKNAME_LENGTH } from './constants';

const WORDS = {
  ko: {
    adjectives: [
      // 개발자 감성
      '야근하는', '카페인', '풀스택', '배포중', '디버깅',
      '핫픽스', '리팩터', '졸린', '버그투성이', '무한루프',
      // 성격/상태
      '겁없는', '말없는', '느긋한', '급한', '고독한',
      '용감한', '수줍은', '당당한', '배고픈', '잠못드는',
      // 재미/위트
      '깃푸시', '세미콜론', '탭전쟁', '다크모드', '점심뭐',
      '퇴근각', '코드리뷰', '새벽감성', '에러요정', '빌드실패',
      // 동물 수식
      '야생의', '전설의', '떠돌이', '심해의', '날아온',
      '숨어든', '깨어난', '방황하는', '돌아온', '미지의',
    ],
    nouns: [
      // 개발자 역할
      '개발자', '코더', '해커', '주니어', '시니어',
      '인턴', '리드', '풀스택러', '옵스', '디버거',
      // 동물 (개발 느낌)
      '고양이', '펭귄', '너구리', '수달', '부엉이',
      '판다', '여우', '고슴도치', '오리', '다람쥐',
      // 판타지/캐릭터
      '마법사', '기사', '닌자', '요정', '용사',
      '현자', '도적', '연금술사', '수호자', '방랑자',
      // 사물 (위트)
      '세미콜론', '커서', '터미널', '픽셀', '바이트',
      '모니터', '키보드', '백엔드', '서버', '봇',
    ],
  },
  en: {
    adjectives: [
      // dev culture
      'sleepy', 'caffeinated', 'deployed', 'debugging', 'hotfix',
      'refactored', 'fullstack', 'legacy', 'agile', 'async',
      // personality
      'bold', 'quiet', 'grumpy', 'chill', 'lonely',
      'brave', 'swift', 'sneaky', 'cosmic', 'fuzzy',
      // witty dev
      'sudo', 'git', 'regex', 'binary', 'kernel',
      'docker', 'null', 'lambda', 'pixel', 'turbo',
      // vibes
      'midnight', 'rogue', 'feral', 'mythic', 'ancient',
      'frozen', 'shadow', 'neon', 'chrome', 'stealth',
    ],
    nouns: [
      // dev roles
      'dev', 'coder', 'hacker', 'intern', 'senior',
      'ninja', 'wizard', 'lead', 'ops', 'noob',
      // animals
      'cat', 'penguin', 'raccoon', 'otter', 'owl',
      'panda', 'fox', 'duck', 'shark', 'wolf',
      // fantasy
      'mage', 'knight', 'rogue', 'sage', 'hero',
      'monk', 'ranger', 'druid', 'bard', 'ghost',
      // objects (witty)
      'cursor', 'pixel', 'byte', 'bot', 'daemon',
      'stack', 'node', 'shard', 'cache', 'bug',
    ],
  },
} as const;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function generateRandomNickname(language: string): string {
  const lang = language in WORDS ? (language as keyof typeof WORDS) : 'en';
  const { adjectives, nouns } = WORDS[lang];

  let nickname: string;
  do {
    nickname = `${pickRandom(adjectives)}_${pickRandom(nouns)}`;
  } while (nickname.length > MAX_NICKNAME_LENGTH);

  return nickname;
}
