// utils/session.js
import redis from './config/redis';

export async function getSession(sender) {
  const rawData = await redis.hgetall(`session:${sender}`);
  return rawData.state ? {
    state: rawData.state,
    propertiesOffset: parseInt(rawData.offset) || 0,
    shownProperties: JSON.parse(rawData.props || '[]'),
    selectedProperty: JSON.parse(rawData.selected || 'null'),
    availableTimes: JSON.parse(rawData.times || '[]')
  } : null;
}

export async function saveSession(sender, session) {
  await redis.hset(`session:${sender}`, {
    state: session.state,
    offset: session.propertiesOffset,
    props: JSON.stringify(session.shownProperties),
    selected: JSON.stringify(session.selectedProperty),
    times: JSON.stringify(session.availableTimes)
  });
  await redis.expire(`session:${sender}`, 86400); // 1 day TTL
}