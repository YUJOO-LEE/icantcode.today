import { test, expect, stubApi, buildPost } from './helpers/api';

/** A long token with no break opportunities — the classic 320px overflow trap. */
const LONG_TOKEN = 'x'.repeat(140);
/** MAX_NICKNAME_LENGTH from src/lib/constants.ts. */
const MAX_NICKNAME = 'a'.repeat(20);

/**
 * Real horizontal overflow shows up as documentElement.scrollWidth exceeding
 * its clientWidth. The 1px slack absorbs subpixel rounding without masking a
 * genuine overflow (an unbroken long token overflows by hundreds of px).
 */
async function horizontalOverflowPx(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
}

test.describe('320px 가로 스크롤 방지', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('긴 본문·작성자명·댓글이 있어도 피드에 가로 스크롤이 생기지 않는다', async ({ page }) => {
    await stubApi(page, {
      status: 'down',
      posts: [
        buildPost({
          id: 1,
          content: `https://example.com/${LONG_TOKEN} ${LONG_TOKEN}`,
          author: 'A'.repeat(20),
          commentCount: 1,
        }),
      ],
      comments: {
        1: [
          {
            id: 1,
            postId: 1,
            content: LONG_TOKEN,
            author: 'Z'.repeat(20),
            createdAt: '2026-03-31T10:00:00Z',
          },
        ],
      },
    });

    await page.goto('/');
    await expect(page.getByText('[ERR]')).toBeVisible();

    // Expand the comment thread so CommentItem (long author + long body) renders.
    await page.getByLabel(/댓글/).first().click();
    await expect(page.getByText('Z'.repeat(20))).toBeVisible();

    expect(await horizontalOverflowPx(page)).toBeLessThanOrEqual(1);
  });

  test('세션 닉네임이 최대 길이여도 헤더에 가로 스크롤이 생기지 않는다', async ({ page }) => {
    await stubApi(page, { status: 'down', posts: [] });
    await page.goto('/');

    // Drive the post flow to push a 20-char nickname into the header prompt.
    await page.getByRole('button', { name: /post --new/ }).click();
    const textarea = page.getByPlaceholder('무슨 일이 있나요?');
    await textarea.fill('hi');
    await textarea.press('Control+Enter');
    await page.getByPlaceholder('닉네임을 입력하세요').fill(MAX_NICKNAME);
    await page.getByRole('button', { name: '[제출]' }).click();

    // Scope to the header (banner) — the footer shows the same handle too.
    await expect(
      page.getByRole('banner').getByText(`${MAX_NICKNAME}@icantcode.today`),
    ).toBeVisible();
    expect(await horizontalOverflowPx(page)).toBeLessThanOrEqual(1);
  });
});

test.describe('터치 디바이스 입력 줌 방지', () => {
  test.use({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true });

  test('포커스되는 입력의 font-size가 16px 이상이라 iOS 자동 줌이 발생하지 않는다', async ({ page }) => {
    await stubApi(page, { status: 'down', posts: [] });
    await page.goto('/');

    // Precondition: the emulated device actually reports a coarse pointer,
    // otherwise the @media (pointer: coarse) rule under test never applies.
    const coarsePointer = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    expect(coarsePointer).toBe(true);

    await page.getByRole('button', { name: /post --new/ }).click();
    const textarea = page.getByPlaceholder('무슨 일이 있나요?');
    await expect(textarea).toBeVisible();

    const fontSizePx = await textarea.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize),
    );
    expect(fontSizePx).toBeGreaterThanOrEqual(16);

    // The 16px bump widens the input's intrinsic size; min-w-0 on the flex
    // child must still keep it inside 320px while the composer is open.
    expect(await horizontalOverflowPx(page)).toBeLessThanOrEqual(1);
  });
});
