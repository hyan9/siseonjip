import { useMemo, useState } from 'react';
import { useData } from '../lib/data-context';
import { postComment, deleteComment, toggleCommentReaction } from '../lib/db';
import { isBotArtworkId } from '../lib/bot-seed';
import { profileLabel, timeAgo, renderTextWithMentions } from '../lib/utils';
import Avatar from './Avatar';

export default function CommentSection({ artworkId, openPerson }) {
  const { userId, getProfile, getRootCommentsFor, getRepliesFor, refresh, addLocalBotComment } = useData();
  const isBotArt = isBotArtworkId(artworkId);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [sort, setSort] = useState('최신순');

  const rootComments = useMemo(() => {
    const list = [...getRootCommentsFor(artworkId)];
    if (sort === '등록순') {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sort === '답글순') {
      list.sort((a, b) => getRepliesFor(b.id).length - getRepliesFor(a.id).length);
    } else {
      // 최신순 (default)
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return list;
  }, [artworkId, getRootCommentsFor, getRepliesFor, sort]);

  const totalCount = useMemo(
    () =>
      rootComments.reduce(
        (sum, c) => sum + 1 + getRepliesFor(c.id).length,
        0
      ),
    [rootComments, getRepliesFor]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() || !userId) return;
    // 봇 작품: DB 호출 없이 메모리에만 추가 (브라우저 새로고침 시 사라짐)
    if (isBotArt) {
      addLocalBotComment(artworkId, text.trim(), replyingTo);
      setText('');
      setReplyingTo(null);
      return;
    }
    setBusy(true);
    try {
      await postComment(artworkId, userId, text.trim(), replyingTo);
      setText('');
      setReplyingTo(null);
      await refresh();
    } catch (error) {
      alert('댓글 실패: ' + error.message);
    } finally {
      setBusy(false);
    }
  };

  const replyTarget = replyingTo
    ? rootComments.find((c) => c.id === replyingTo) ||
      rootComments.flatMap((r) => getRepliesFor(r.id)).find((c) => c.id === replyingTo)
    : null;

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h3 className="text-[13px] font-bold text-[var(--text)]">
          댓글 <span className="text-[var(--ink)]">{totalCount}</span>
        </h3>
        {totalCount > 1 && (
          <div className="flex gap-2 text-[10px]">
            {['등록순', '최신순', '답글순'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={sort === s ? 'font-bold text-[var(--ink)]' : 'text-[var(--text-muted)]'}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {replyingTo && replyTarget && (
        <div className="mb-2 flex items-center justify-between rounded-[10px] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] text-[var(--text-body)]">
          <span>↳ {profileLabel(getProfile(replyTarget.user_id))}에게 답글</span>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-[var(--text-muted)]">취소</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={replyingTo ? '답글…' : '댓글…'}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[13px] text-[var(--text)] outline-none focus:border-[var(--ink)]"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-full bg-[var(--ink)] px-3.5 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
        >
          {replyingTo ? '답글' : '등록'}
        </button>
      </form>

      <div className="space-y-3">
        {rootComments.length === 0 && (
          <p className="px-1 py-2 text-[12px] text-[var(--text-faint)]">아직 댓글이 없어요. 첫 감상을 남겨보세요.</p>
        )}
        {rootComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={() => setReplyingTo(comment.id)}
            openPerson={openPerson}
          />
        ))}
      </div>
    </section>
  );
}

function CommentItem({ comment, onReply, isReply = false, openPerson }) {
  const {
    userId,
    profiles,
    getProfile,
    getRepliesFor,
    getCommentReactionCount,
    isCommentLikedByMe,
    refresh,
  } = useData();
  const author = getProfile(comment.user_id);
  const isMine = comment.user_id === userId;
  const liked = isCommentLikedByMe(comment.id);
  const likeCount = getCommentReactionCount(comment.id);
  const replies = isReply ? [] : getRepliesFor(comment.id);
  const [busy, setBusy] = useState(false);

  const handleLike = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      await toggleCommentReaction(comment.id, userId, liked);
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    try {
      await deleteComment(comment.id, userId);
      await refresh();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  const avatarSize = isReply ? 26 : 32;

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => openPerson?.(author?.id)}
          className="shrink-0"
        >
          <Avatar profile={author} size={avatarSize} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-tight">
            <button
              type="button"
              onClick={() => openPerson?.(author?.id)}
              className="font-bold text-[var(--text)]"
            >
              {profileLabel(author)}
            </button>
            <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">{timeAgo(comment.created_at)}</span>
          </p>
          <p className="mt-0.5 break-words text-[13.5px] leading-snug text-[var(--text)]">
            {renderTextWithMentions(comment.text, profiles, openPerson)}
          </p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
            <button
              type="button"
              onClick={handleLike}
              disabled={busy || !userId}
              className={liked ? 'text-red-500' : ''}
            >
              {liked ? '♥' : '♡'} {likeCount > 0 ? likeCount : ''}
            </button>
            {!isReply && (
              <button type="button" onClick={onReply}>
                답글
              </button>
            )}
            {isMine && (
              <button type="button" onClick={handleDelete} className="text-red-500">
                삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {!isReply && replies.length > 0 && (
        <div className="mt-2 ml-[18px] border-l border-[var(--border)] pl-4">
          <div className="space-y-3">
            {replies.map((r) => (
              <CommentItem key={r.id} comment={r} isReply onReply={() => {}} openPerson={openPerson} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
