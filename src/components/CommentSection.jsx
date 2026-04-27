import { useState } from 'react';
import { useData } from '../lib/data-context';
import { postComment, deleteComment, toggleCommentReaction } from '../lib/db';
import { profileLabel, timeAgo, renderTextWithMentions } from '../lib/utils';
import Icon from './Icon';

export default function CommentSection({ artworkId, openPerson }) {
  const { userId, getProfile, getRootCommentsFor, refresh } = useData();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const rootComments = getRootCommentsFor(artworkId).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() || !userId) return;
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
      rootComments.flatMap((r) => [r]).find((c) => c.id === replyingTo)
    : null;

  return (
    <section className="rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
      <div className="mb-4">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">감상 노트</p>
        <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.06em]">이 사진 앞에서</h2>
      </div>

      {replyingTo && replyTarget && (
        <div className="mb-2 flex items-center justify-between rounded-[14px] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-body)]">
          <span>↳ {profileLabel(getProfile(replyTarget.user_id))}에게 답글</span>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-[var(--text-muted)]">취소</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={replyingTo ? '답글… (@닉네임으로 멘션 가능)' : '짧게 남기기 (@닉네임 멘션 가능)'}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] outline-none"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {replyingTo ? '답글' : '남기기'}
        </button>
      </form>

      <div className="space-y-4">
        {rootComments.length === 0 && (
          <p className="text-xs text-[var(--text-faint)]">아직 노트가 없어요. 첫 감상을 남겨보세요.</p>
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
  const replies = getRepliesFor(comment.id);
  const [showReplies, setShowReplies] = useState(replies.length > 0 && replies.length <= 3);
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

  return (
    <article className={`${isReply ? 'ml-5 border-l border-[var(--border)] pl-3' : 'border-l border-[var(--ink)] pl-4'}`}>
      <p className="text-[15px] leading-7 text-[var(--text-quote)]">
        "{renderTextWithMentions(comment.text, profiles, openPerson)}"
      </p>
      <p className="mt-1 text-[11px] tracking-[0.12em] text-[var(--text-meta)]">
        <button type="button" onClick={() => openPerson?.(author?.id)} className="hover:underline">
          {profileLabel(author)}
        </button>
        {' · '}{timeAgo(comment.created_at)}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
        <button
          type="button"
          onClick={handleLike}
          disabled={busy || !userId}
          className={`inline-flex items-center gap-1 ${liked ? 'text-red-500' : 'text-[var(--text-muted)]'}`}
        >
          <Icon name={liked ? 'heartFilled' : 'heart'} size={13} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        {!isReply && (
          <button type="button" onClick={onReply} className="inline-flex items-center gap-1">
            <Icon name="reply" size={13} />
            답글
          </button>
        )}
        {isMine && (
          <button type="button" onClick={handleDelete} className="text-red-500">삭제</button>
        )}
      </div>

      {!isReply && replies.length > 0 && (
        <div className="mt-2">
          {!showReplies ? (
            <button
              type="button"
              onClick={() => setShowReplies(true)}
              className="text-[11px] text-[var(--text-muted)] underline"
            >
              답글 {replies.length}개 보기
            </button>
          ) : (
            <div className="mt-2 space-y-3">
              {replies.map((r) => (
                <CommentItem key={r.id} comment={r} isReply onReply={() => {}} openPerson={openPerson} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
