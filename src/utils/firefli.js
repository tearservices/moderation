const axios = require('axios');

const client = axios.create({
  baseURL: process.env.FIREFLI_BASE_URL || 'https://www.firefli.net/api/public/v1',
  headers: {
    Authorization: `Bearer ${process.env.FIREFLI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

const get = (url) => client.get(url).then(r => r.data);
const post = (url, data) => client.post(url, data).then(r => r.data);
const patch = (url, data) => client.patch(url, data).then(r => r.data);
const del = (url) => client.delete(url).then(r => r.data);

const w = (id) => `/workspace/${id}`;

module.exports = {
  workspace: {
    info: (id) => get(`${w(id)}/info`),
    leaderboard: (id) => get(`${w(id)}/leaderboard`),
    members: (id) => get(`${w(id)}/members`),
    activity: (id) => get(`${w(id)}/activity`),
    userActivity: (id, uid) => get(`${w(id)}/user/${uid}/activity`),
    lastReset: (id) => get(`${w(id)}/lastreset`),
    allies: (id) => get(`${w(id)}/allies`),
    wall: (id) => get(`${w(id)}/wall`),
    postWall: (id, data) => post(`${w(id)}/wall`, data),
    docs: (id) => get(`${w(id)}/docs`),
    doc: (id, docId) => get(`${w(id)}/docs/${docId}`),
  },
  sessions: {
    calendar: (id) => get(`${w(id)}/sessions/calendar`),
    sets: (id) => get(`${w(id)}/sessions/sets`),
    createUnscheduled: (id, data) => post(`${w(id)}/sessions/create-unscheduled`, data),
    createScheduled: (id, data) => post(`${w(id)}/sessions/create-scheduled`, data),
  },
  notices: {
    list: (id) => get(`${w(id)}/notices`),
    get: (id, nid) => get(`${w(id)}/notices/${nid}`),
    create: (id, data) => post(`${w(id)}/notices`, data),
    update: (id, nid, data) => patch(`${w(id)}/notices/${nid}`, data),
    delete: (id, nid) => del(`${w(id)}/notices/${nid}`),
    summary: (id) => get(`${w(id)}/notices/summary`),
    user: (id, uid) => get(`${w(id)}/notices/user/${uid}`),
  },
  userbook: {
    entries: (id) => get(`${w(id)}/userbook/entries`),
    addNote: (id, data) => post(`${w(id)}/userbook/note`, data),
    addWarning: (id, data) => post(`${w(id)}/userbook/warning`, data),
    promote: (id, data) => post(`${w(id)}/userbook/promotion`, data),
    demote: (id, data) => post(`${w(id)}/userbook/demotion`, data),
    terminate: (id, data) => post(`${w(id)}/userbook/termination`, data),
    rankChange: (id, data) => post(`${w(id)}/userbook/rank-change`, data),
  },
  moderation: {
    cases: (id) => get(`${w(id)}/moderation/cases`),
    userCases: (id, uid) => get(`${w(id)}/moderation/user/${uid}`),
    live: (id) => get(`${w(id)}/moderation/live`),
    createCase: (id, data) => post(`${w(id)}/moderation/cases`, data),
    revokeCase: (id, caseId) => post(`${w(id)}/moderation/cases/${caseId}/revoke`, {}),
  },
  recommendations: {
    list: (id) => get(`${w(id)}/recommendations`),
    create: (id, data) => post(`${w(id)}/recommendations`, data),
    get: (id, rid) => get(`${w(id)}/recommendations/${rid}`),
  },
};
