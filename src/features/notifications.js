export function stopNotificationsSubscriptionFeature(ctx) {
  const unsub = ctx.getNotificationsUnsubscriber();
  if (typeof unsub === 'function') unsub();
  ctx.setNotificationsUnsubscriber(null);
  ctx.setNotificationsState([]);
  ctx.setUnreadNotificationsCount(0);
  const badge = ctx.document.getElementById('notifications-badge');
  if (badge) badge.style.display = 'none';
}

export async function markAllNotificationsReadFeature(ctx) {
  const unread = ctx.getNotificationsState().filter(n => !n.read);
  for (const n of unread) {
    try { await ctx.updateDoc(ctx.doc(ctx.db, 'notifications', n.id), { read: true }); } catch (_) {}
  }
}

export async function prefetchNotificationActorsFeature(ctx, items = []) {
  const actorIds = Array.from(new Set(items.map(n => n.actorId).filter(Boolean))).filter(uid => !ctx.notificationActorCache.has(uid));
  if (!actorIds.length) return;
  await Promise.all(actorIds.map(async (uid) => {
    try {
      const snap = await ctx.getDoc(ctx.doc(ctx.db, 'users', uid));
      const row = snap.exists() ? (snap.data() || {}) : {};
      ctx.notificationActorCache.set(uid, {
        username: row.username || row.displayName || 'Climber',
        avatarUrl: row.avatarUrl || row.photoURL || null
      });
    } catch (_) {
      ctx.notificationActorCache.set(uid, { username: 'Climber', avatarUrl: null });
    }
  }));
}

export async function openNotificationTargetFeature(ctx, notification) {
  if (!notification) return;
  const type = String(notification.type || '');
  if (type === 'POST_LIKE' || type === 'POST_COMMENT') {
    ctx.setUserMainTab('social');
    ctx.setSocialSubView('main');
    ctx.renderFollowingSection();
    if (notification.postId) await ctx.openSocialCommentsModal(notification.postId).catch(() => {});
    return;
  }
  if (type === 'SECTOR_RESET') {
    if (notification.gymId && notification.sectorId) {
      ctx.setUserMainTab('explore');
      ctx.open3D(notification.gymId, notification.sectorId);
    } else if (notification.gymId) {
      ctx.setUserMainTab('explore');
      ctx.openGymDetail(notification.gymId);
    }
    return;
  }
  if (type === 'NEW_SECTOR' && notification.gymId) {
    ctx.setUserMainTab('explore');
    ctx.openGymDetail(notification.gymId);
    return;
  }
  if (type === 'NEW_EVENT_PUBLISHED' && notification.gymId) {
    ctx.setUserMainTab('explore');
    ctx.openGymDetail(notification.gymId);
  }
}

export function renderNotificationsPanelFeature(ctx) {
  const list = ctx.document.getElementById('notifications-list');
  if (!list) return;
  console.info('[notifications] renderNotificationsPanel', { count: ctx.notificationsState.length });
  if (!ctx.notificationsState.length) {
    console.info('[notifications] render empty state');
    list.innerHTML = `<p class="profile-empty">${ctx.t('notifications.empty')}</p>`;
    return;
  }
  list.innerHTML = ctx.notificationsState.map(n => {
    const actor = n.actorId ? (ctx.notificationActorCache.get(n.actorId) || null) : null;
    const actorLabel = actor?.username ? actor.username.slice(0, 2).toUpperCase() : '👤';
    const status = n.read ? ctx.t('notifications.read') : ctx.t('notifications.unread');
    const msg = n.message || ctx.t(`notifications.${n.type}`);
    const actorAvatar = actor?.avatarUrl
      ? `<img class="notif-avatar" src="${ctx.escapeHtml(actor.avatarUrl)}" alt="">`
      : `<div class="notif-avatar">${ctx.escapeHtml(actorLabel)}</div>`;
    return `<div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">${actorAvatar}<div class="notif-content"><div>${ctx.escapeHtml(msg)}</div><div class="notif-meta"><span>${ctx.escapeHtml(ctx.formatRelativeTime(n.createdAt))}</span><span>${ctx.escapeHtml(status)}</span></div></div></div>`;
  }).join('');
  list.querySelectorAll('.notif-item').forEach(el => {
    el.onclick = async () => {
      const id = el.dataset.id;
      if (!id) return;
      const notification = ctx.notificationsState.find(n => n.id === id) || null;
      try { await ctx.updateDoc(ctx.doc(ctx.db, 'notifications', id), { read: true }); } catch (_) {}
      ctx.closeNotificationsPanel();
      await ctx.openNotificationTarget(notification);
    };
  });
}

export function closeNotificationsPanelFeature(ctx) {
  const modal = ctx.document.getElementById('notifications-modal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
}
