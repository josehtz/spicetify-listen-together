"use strict";

const react = Spicetify.React;
const { useState, useEffect, useRef } = react;

const STROKED = {
  headphones: [
    ["path", { d: "M3 18v-6a9 9 0 0 1 18 0v6" }],
    ["path", { d: "M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" }]
  ],
  plus: [["path", { d: "M12 5v14M5 12h14" }]],
  arrowRight: [["path", { d: "M5 12h14M12 5l7 7-7 7" }]],
  arrowLeft: [["path", { d: "M19 12H5M12 19l-7-7 7-7" }]],
  x: [["path", { d: "M18 6L6 18M6 6l12 12" }]],
  copy: [
    ["rect", { x: 9, y: 9, width: 13, height: 13, rx: 2, ry: 2 }],
    ["path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }]
  ],
  users: [
    ["path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: 9, cy: 7, r: 4 }],
    ["path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }],
    ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }]
  ],
  crown: [
    ["path", { d: "M3 18l-1.5-9L7 12.5 12 5l5 7.5L22.5 9 21 18H3z" }],
    ["path", { d: "M3.5 21h17" }]
  ],
  message: [["path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" }]],
  send: [["path", { d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" }]],
  music: [
    ["path", { d: "M9 18V5l12-2v13" }],
    ["circle", { cx: 6, cy: 18, r: 3 }],
    ["circle", { cx: 18, cy: 16, r: 3 }]
  ],
  check: [["path", { d: "M20 6L9 17l-5-5" }]],
  ban: [
    ["circle", { cx: 12, cy: 12, r: 10 }],
    ["path", { d: "M4.9 4.9l14.2 14.2" }]
  ],
  lock: [
    ["rect", { x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 }],
    ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }]
  ]
};

const FILLED = {
  play: "M8 5v14l11-7z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z"
};

function icon(name, size) {
  const s = size || 18;
  return react.createElement("svg", {
    viewBox: "0 0 24 24",
    width: s,
    height: s,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "lt-ic",
    "aria-hidden": "true"
  }, STROKED[name].map(function (el, i) {
    return react.createElement(el[0], Object.assign({ key: i }, el[1]));
  }));
}

function iconFill(name, size) {
  const s = size || 18;
  return react.createElement("svg", {
    viewBox: "0 0 24 24",
    width: s,
    height: s,
    fill: "currentColor",
    className: "lt-ic",
    "aria-hidden": "true"
  }, react.createElement("path", { d: FILLED[name] }));
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const a = new Uint8Array(8);
  window.crypto.getRandomValues(a);
  let out = "";
  for (let i = 0; i < a.length; i++) out += chars[a[i] % chars.length];
  return out;
}

function trackMeta() {
  try {
    const item = Spicetify.Player.data && Spicetify.Player.data.item;
    if (!item) return null;
    let art = null;
    if (item.images && item.images[0]) art = item.images[0].url;
    else if (item.album && item.album.images && item.album.images[0]) art = item.album.images[0].url;
    return {
      uri: item.uri,
      name: item.name,
      artists: (item.artists || []).map(function (a) { return a.name; }).join(", "),
      album: (item.album && item.album.name) || "",
      art: art,
      duration: item.duration_ms || 0
    };
  } catch (e) {
    return null;
  }
}

function playerState() {
  let pos = 0;
  let playing = false;
  try { pos = Spicetify.Player.getProgress(); } catch (e) {}
  try { playing = Spicetify.Player.isPlaying(); } catch (e) {}
  return { meta: trackMeta(), pos: pos, playing: playing, ts: Date.now() };
}

function fmt(ms) {
  const m = Math.floor((ms || 0) / 60000);
  const s = Math.floor(((ms || 0) % 60000) / 1000);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

const ICE = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" }
];

const Engine = {
  peer: null,
  isHost: false,
  hostId: null,
  code: null,
  roomName: "",
  localName: "",
  pwHash: null,
  connections: {},
  hostConn: null,
  participants: [],
  ready: false,
  applyingUntil: 0,
  pending: null,
  lastRemoteMeta: null,
  heartbeat: null,
  listeners: {},
  joinRes: null,
  joinRej: null,

  on: function (evt, fn) {
    (this.listeners[evt] = this.listeners[evt] || []).push(fn);
  },

  emit: function (evt, data) {
    (this.listeners[evt] || []).forEach(function (f) {
      try { f(data); } catch (e) { console.error(e); }
    });
  },

  send: function (conn, msg) {
    try {
      if (conn && conn.open) conn.send(JSON.stringify(msg));
    } catch (e) {}
  },

  sendAll: function (msg) {
    const data = JSON.stringify(msg);
    for (const pid in this.connections) {
      try {
        if (this.connections[pid].open) this.connections[pid].send(data);
      } catch (e) {}
    }
  },

  sendToHost: function (msg) {
    this.send(this.hostConn, msg);
  },

  makePeer: function (id) {
    if (!window.Peer) throw new Error("PeerJS no disponible");
    return new window.Peer(id, { debug: 0, config: { iceServers: ICE } });
  },

  attach: function (peer) {
    const self = this;
    peer.on("error", function (err) {
      let msg = "Error de conexión P2P";
      if (err.type === "peer-unavailable") msg = "No existe ninguna sala con ese ID";
      else if (err.type === "network" || err.type === "server-error") msg = "Sin conexión con el servicio de señalización";
      else if (err.type === "unavailable-id") msg = "ID de sala en uso, intenta crearla otra vez";
      self.emit("error", msg);
      if (self.joinRej) {
        const r = self.joinRej;
        self.joinRej = null;
        r(new Error(msg));
      }
    });
  },

  startHeartbeat: function () {
    const self = this;
    this.stopHeartbeat();
    this.heartbeat = setInterval(function () {
      if (self.isHost && self.ready) self.broadcastState();
    }, 2000);
  },

  stopHeartbeat: function () {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  },

  broadcastState: function () {
    if (!this.isHost) return;
    this.sendAll({ t: "state", state: playerState() });
  },

  broadcastParticipants: function () {
    this.sendAll({ t: "participants", list: this.participants });
    this.emit("participants");
  },

  createRoom: function (opts) {
    const self = this;
    this.code = genCode();
    this.roomName = opts.roomName || "Sala";
    this.localName = opts.displayName || "Anfitrión";
    this.pwHash = opts.password ? hashStr(opts.password) : null;
    this.isHost = true;
    this.ready = true;
    this.lastRemoteMeta = null;
    this.connections = {};
    this.participants = [];

    return new Promise(function (res, rej) {
      let peer;
      try {
        peer = self.makePeer("l2g-" + self.code);
      } catch (e) {
        rej(e);
        return;
      }
      self.peer = peer;
      peer.on("open", function (id) {
        self.hostId = id;
        self.participants = [{ id: id, name: self.localName, isHost: true }];
        self.attach(peer);
        peer.on("connection", function (conn) { self.handleIncoming(conn); });
        self.startHeartbeat();
        self.broadcastState();
        self.emit("participants");
        res(self.code);
      });
      peer.on("error", rej);
    });
  },

  joinRoom: function (opts) {
    const self = this;
    this.code = String(opts.code || "").trim().toUpperCase();
    this.localName = opts.displayName || "Invitado";
    this.pwHash = opts.password ? hashStr(opts.password) : null;
    this.isHost = false;
    this.ready = false;
    this.lastRemoteMeta = null;

    return new Promise(function (res, rej) {
      self.joinRes = res;
      self.joinRej = rej;
      let peer;
      try {
        peer = self.makePeer(undefined);
      } catch (e) {
        rej(e);
        return;
      }
      self.peer = peer;
      peer.on("open", function () {
        self.attach(peer);
        peer.on("connection", function (conn) { self.handleIncoming(conn); });
        self.connectTo("l2g-" + self.code);
      });
      peer.on("error", function (err) {
        if (self.joinRej) {
          const r = self.joinRej;
          self.joinRej = null;
          r(err);
        }
      });
      setTimeout(function () {
        if (self.joinRej) {
          const r = self.joinRej;
          self.joinRej = null;
          r(new Error("Tiempo agotado. Comprueba que la sala exista y esté abierta."));
        }
      }, 12000);
    });
  },

  connectTo: function (hostId) {
    const self = this;
    const old = this.hostConn;
    this.hostConn = null;
    if (old) {
      try { old.close(); } catch (e) {}
    }
    const conn = this.peer.connect(hostId, { reliable: true });
    this.hostConn = conn;
    conn.on("open", function () {
      self.send(conn, { t: "hello", name: self.localName, pwh: self.pwHash, code: self.code });
    });
    conn.on("data", function (raw) {
      let m;
      try { m = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return; }
      self.handleGuestMsg(conn, m);
    });
    conn.on("close", function () {
      if (self.hostConn !== conn) return;
      self.hostConn = null;
      if (self.ready) {
        self.ready = false;
        self.emit("disconnected");
      }
    });
  },

  handleIncoming: function (conn) {
    const self = this;
    conn.on("open", function () {
      conn.on("data", function (raw) {
        let m;
        try { m = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return; }
        self.handleHostMsg(conn, m);
      });
      conn.on("close", function () {
        if (self.connections[conn.peer]) {
          delete self.connections[conn.peer];
          self.removeParticipant(conn.peer);
        }
      });
    });
  },

  handleHostMsg: function (conn, m) {
    const self = this;
    if (m.t === "hello") {
      if (!this.isHost) {
        this.send(conn, { t: "redirect", hostId: this.hostId });
        return;
      }
      if (this.pwHash && this.pwHash !== m.pwh) {
        this.send(conn, { t: "deny", msg: "Contraseña incorrecta" });
        setTimeout(function () { try { conn.close(); } catch (e) {} }, 300);
        return;
      }
      this.connections[conn.peer] = conn;
      const exists = this.participants.some(function (p) { return p.id === conn.peer; });
      if (!exists) {
        this.participants.push({ id: conn.peer, name: m.name || "Invitado", isHost: false });
      }
      this.participants.forEach(function (p) { p.isHost = p.id === self.peer.id; });
      this.send(conn, {
        t: "welcome",
        code: this.code,
        roomName: this.roomName,
        hostId: this.hostId,
        list: this.participants,
        state: playerState()
      });
      this.broadcastParticipants();
      return;
    }
    if (m.t === "chat" && this.isHost) {
      const msg = { t: "chat", from: m.name || "Alguien", text: m.text, ts: Date.now() };
      this.emit("chat", msg);
      this.sendAll(msg);
      return;
    }
    if (m.t === "sync-req") {
      this.send(conn, { t: "state", state: playerState() });
      return;
    }
    if (m.t === "leave") {
      delete this.connections[conn.peer];
      this.removeParticipant(conn.peer);
      try { conn.close(); } catch (e) {}
    }
  },

  handleGuestMsg: function (conn, m) {
    if (m.t === "welcome") {
      this.code = m.code;
      this.roomName = m.roomName;
      this.hostId = m.hostId;
      this.participants = m.list || [];
      this.ready = true;
      if (this.joinRes) {
        const r = this.joinRes;
        this.joinRes = null;
        this.joinRej = null;
        r(this.code);
      }
      this.emit("joined");
      this.emit("participants");
      if (m.state) this.applyState(m.state);
      return;
    }
    if (m.t === "state") {
      this.applyState(m.state);
      return;
    }
    if (m.t === "participants") {
      this.participants = m.list || [];
      this.emit("participants");
      return;
    }
    if (m.t === "chat") {
      this.emit("chat", m);
      return;
    }
    if (m.t === "redirect") {
      if (m.hostId && m.hostId !== conn.peer) this.connectTo(m.hostId);
      return;
    }
    if (m.t === "host-change") {
      if (m.hostId && this.peer && m.hostId === this.peer.id) {
        this.becomeHost(m.list);
      } else if (m.hostId) {
        this.hostId = m.hostId;
        this.connectTo(m.hostId);
      }
      return;
    }
    if (m.t === "deny") {
      if (this.joinRej) {
        const r = this.joinRej;
        this.joinRej = null;
        this.joinRes = null;
        r(new Error(m.msg));
      }
      this.emit("error", m.msg);
      return;
    }
    if (m.t === "kick") {
      this.emit("kicked");
      this.leave();
    }
  },

  applyState: function (st) {
    if (!st) return;
    this.lastRemoteMeta = st.meta || null;
    this.emit("state", st);
    try {
      const cur = trackMeta();
      if (st.meta && (!cur || cur.uri !== st.meta.uri)) {
        this.applyingUntil = Date.now() + 5000;
        this.pending = { pos: st.pos, playing: st.playing };
        Spicetify.Player.playUri(st.meta.uri);
        return;
      }
      this.applyingUntil = Date.now() + 2500;
      const pos = Spicetify.Player.getProgress();
      if (typeof st.pos === "number" && Math.abs(pos - st.pos) > 1500) {
        Spicetify.Player.seek(st.pos);
      }
      const p = Spicetify.Player.isPlaying();
      if (st.playing && !p) Spicetify.Player.play();
      if (!st.playing && p) Spicetify.Player.pause();
    } catch (e) { console.error(e); }
  },

  removeParticipant: function (pid) {
    if (!this.isHost) return;
    this.participants = this.participants.filter(function (p) { return p.id !== pid; });
    this.broadcastParticipants();
  },

  kick: function (pid) {
    if (!this.isHost || !this.peer || pid === this.peer.id) return;
    const c = this.connections[pid];
    if (c) {
      this.send(c, { t: "kick" });
      setTimeout(function () { try { c.close(); } catch (e) {} }, 250);
      delete this.connections[pid];
    }
    this.removeParticipant(pid);
  },

  transferHost: function (pid) {
    if (!this.isHost || !this.connections[pid]) return;
    const self = this;
    const newHost = pid;
    this.isHost = false;
    this.hostId = newHost;
    this.stopHeartbeat();
    const newList = this.participants.map(function (p) {
      return { id: p.id, name: p.name, isHost: p.id === newHost };
    });
    this.sendAll({ t: "host-change", hostId: newHost, list: newList });
    this.participants = newList;
    this.emit("participants");
    this.emit("role");
    Object.keys(this.connections).forEach(function (k) {
      try { self.connections[k].close(); } catch (e) {}
    });
    this.connections = {};
    this.connectTo(newHost);
  },

  becomeHost: function (list) {
    const self = this;
    this.isHost = true;
    this.ready = true;
    this.hostId = this.peer.id;
    this.connections = {};
    const src = (list && list.length)
      ? list
      : [{ id: this.peer.id, name: this.localName, isHost: true }];
    this.participants = src.map(function (p) {
      return { id: p.id, name: p.name, isHost: p.id === self.peer.id };
    });
    this.startHeartbeat();
    this.broadcastParticipants();
    this.broadcastState();
    this.emit("role");
  },

  sendChat: function (text) {
    if (!text || !text.trim()) return;
    if (this.isHost) {
      const full = { t: "chat", from: this.localName, text: text.trim(), ts: Date.now() };
      this.emit("chat", full);
      this.sendAll(full);
    } else {
      this.sendToHost({ t: "chat", name: this.localName, text: text.trim() });
    }
  },

  leave: function () {
    this.stopHeartbeat();
    if (this.hostConn) {
      try { this.hostConn.send(JSON.stringify({ t: "leave" })); } catch (e) {}
    }
    for (const k in this.connections) {
      try { this.connections[k].close(); } catch (e) {}
    }
    try { if (this.peer) this.peer.destroy(); } catch (e) {}
    this.peer = null;
    this.hostConn = null;
    this.connections = {};
    this.ready = false;
    this.isHost = false;
    this.hostId = null;
    this.participants = [];
    this.lastRemoteMeta = null;
    this.pending = null;
    this.emit("left");
  }
};

let playerHooksAdded = false;

function addPlayerHooks() {
  if (playerHooksAdded) return;
  playerHooksAdded = true;
  Spicetify.Player.addEventListener("songchange", function () {
    const applying = Date.now() < Engine.applyingUntil;
    if (Engine.pending && applying) {
      const pend = Engine.pending;
      Engine.pending = null;
      try {
        if (typeof pend.pos === "number") Spicetify.Player.seek(pend.pos);
        if (pend.playing === false) Spicetify.Player.pause();
        else Spicetify.Player.play();
      } catch (e) {}
    }
    if (Engine.isHost && Engine.ready) Engine.broadcastState();
    else if (!Engine.isHost && Engine.ready && !applying) Engine.sendToHost({ t: "sync-req" });
    Engine.emit("track");
  });
  Spicetify.Player.addEventListener("onplaypause", function () {
    const applying = Date.now() < Engine.applyingUntil;
    if (Engine.isHost && Engine.ready) Engine.broadcastState();
    else if (!Engine.isHost && Engine.ready && !applying) Engine.sendToHost({ t: "sync-req" });
    Engine.emit("track");
  });
}

function Avatar(props) {
  const ch = (props.name || "?").charAt(0).toUpperCase();
  return react.createElement("div", { className: "avatar" + (props.host ? " avatar-host" : "") }, ch);
}

function App() {
  const [view, setView] = useState("lobby");
  const [tab, setTab] = useState("menu");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [participants, setParticipants] = useState([]);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [track, setTrack] = useState(trackMeta);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(function () {
    addPlayerHooks();
    Engine.listeners = {};

    function goLobby() {
      Engine.leave();
      setView("lobby");
      setTab("menu");
      setChat([]);
      setParticipants([]);
      setRoomCode("");
      setNotice(null);
      setError(null);
      setIsHost(false);
    }

    Engine.on("participants", function () {
      setParticipants(Engine.participants.slice());
      setIsHost(Engine.isHost);
    });
    Engine.on("role", function () { setIsHost(Engine.isHost); });
    Engine.on("joined", function () {
      setRoomCode(Engine.code);
      setRoomName(Engine.roomName);
      setIsHost(Engine.isHost);
      setParticipants(Engine.participants.slice());
      setError(null);
      setNotice(null);
      setView("room");
    });
    Engine.on("chat", function (m) {
      setChat(function (prev) { return prev.concat([m]).slice(-200); });
    });
    Engine.on("error", function (msg) {
      setError(msg);
      setNotice(msg);
    });
    Engine.on("disconnected", function () {
      setNotice("El anfitrión se ha desconectado. La sala se ha cerrado.");
      setTimeout(goLobby, 2500);
    });
    Engine.on("kicked", function () {
      setNotice("Has sido expulsado de la sala.");
      setTimeout(goLobby, 2500);
    });
    Engine.on("track", function () {
      setTrack(trackMeta());
      setPlaying(Spicetify.Player.isPlaying());
      setProgress(Spicetify.Player.getProgress());
    });

    const iv = setInterval(function () {
      const m = trackMeta();
      setTrack(function (prev) {
        if (!m && !prev) return prev;
        if (!m || !prev) return m;
        if (m.uri !== prev.uri || m.name !== prev.name) return m;
        return prev;
      });
      try {
        setProgress(Spicetify.Player.getProgress());
        setPlaying(Spicetify.Player.isPlaying());
      } catch (e) {}
    }, 500);

    return function () { clearInterval(iv); };
  }, []);

  useEffect(function () {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  function resetToLobby() {
    Engine.leave();
    setView("lobby");
    setTab("menu");
    setChat([]);
    setParticipants([]);
    setRoomCode("");
    setNotice(null);
    setError(null);
    setIsHost(false);
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Introduce tu nombre");
      return;
    }
    setError(null);
    setLoading(true);
    Engine.createRoom({
      roomName: name.trim() + "'s room",
      displayName: name.trim(),
      password: pw.trim() || null
    }).then(function (code) {
      setRoomCode(code);
      setRoomName(Engine.roomName);
      setIsHost(true);
      setParticipants(Engine.participants.slice());
      setView("room");
    }).catch(function (err) {
      setError(err && err.message ? err.message : "No se pudo crear la sala");
    }).finally(function () { setLoading(false); });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Introduce tu nombre");
      return;
    }
    if (!codeInput.trim()) {
      setError("Introduce el ID de la sala");
      return;
    }
    setError(null);
    setLoading(true);
    Engine.joinRoom({
      code: codeInput,
      displayName: name.trim(),
      password: pw.trim() || null
    }).then(function () {
      setParticipants(Engine.participants.slice());
      setView("room");
    }).catch(function (err) {
      setError(err && err.message ? err.message : "No se pudo unir a la sala");
    }).finally(function () { setLoading(false); });
  }

  function copyInvite() {
    const text = "Únete a mi sala de Listen Together. Abre la app en Spotify y usa el ID: " + roomCode;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2000);
  }

  function togglePlay() {
    if (!isHost) return;
    try {
      if (Spicetify.Player.isPlaying()) Spicetify.Player.pause();
      else Spicetify.Player.play();
      Engine.broadcastState();
    } catch (e) {}
  }

  function doSeek(v) {
    if (!isHost) return;
    try {
      Spicetify.Player.seek(v);
      Engine.broadcastState();
    } catch (e) {}
  }

  function sendChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    Engine.sendChat(chatInput);
    setChatInput("");
  }

  if (view === "lobby") {
    return react.createElement("div", { className: "lt-app" },
      react.createElement("div", { className: "lt-hero" },
        react.createElement("div", { className: "lt-logo" }, icon("headphones", 38)),
        react.createElement("h1", null, "Listen Together"),
        react.createElement("p", { className: "lt-sub" },
          "Crea una sala y escucha la misma canción con tus amigos en tiempo real."),
        tab === "create" || tab === "join"
          ? react.createElement("form", {
              className: "lt-card lt-form",
              onSubmit: tab === "create" ? handleCreate : handleJoin
            },
              react.createElement("button", {
                type: "button",
                className: "lt-back",
                onClick: function () { setTab("menu"); setError(null); }
              }, icon("arrowLeft", 15), react.createElement("span", null, "Volver")),
              react.createElement("h2", null, tab === "create" ? "Crear sala" : "Unirse a sala"),
              react.createElement("div", { className: "lt-field" },
                react.createElement("label", null, "Tu nombre"),
                react.createElement("input", {
                  type: "text",
                  value: name,
                  onChange: function (e) { setName(e.target.value); },
                  placeholder: "Ej: Carlos",
                  autoFocus: true
                })),
              tab === "join" && react.createElement("div", { className: "lt-field" },
                react.createElement("label", null, "ID de la sala"),
                react.createElement("input", {
                  type: "text",
                  value: codeInput,
                  onChange: function (e) { setCodeInput(e.target.value.toUpperCase()); },
                  placeholder: "Ej: AB12CD34"
                })),
              react.createElement("div", { className: "lt-field" },
                react.createElement("label", null,
                  "Contraseña",
                  tab === "create" ? " (opcional)" : ""),
                react.createElement("input", {
                  type: "password",
                  value: pw,
                  onChange: function (e) { setPw(e.target.value); },
                  placeholder: tab === "create" ? "Déjala vacía si es pública" : "Si la sala la tiene"
                })),
              error && react.createElement("div", { className: "lt-error" }, error),
              react.createElement("button", {
                type: "submit",
                className: "lt-btn lt-btn-primary",
                disabled: loading
              }, loading ? "Conectando…" : tab === "create" ? "Crear sala" : "Unirse")
            )
          : react.createElement("div", { className: "lt-actions" },
              react.createElement("button", {
                className: "lt-btn lt-btn-primary lt-btn-big",
                onClick: function () { setTab("create"); setError(null); }
              }, icon("plus", 20), react.createElement("span", null, "Crear sala")),
              react.createElement("button", {
                className: "lt-btn lt-btn-ghost lt-btn-big",
                onClick: function () { setTab("join"); setError(null); }
              }, react.createElement("span", null, "Unirse con ID"), icon("arrowRight", 20))
            ),
        error && tab === "menu" && react.createElement("div", { className: "lt-error" }, error)
      )
    );
  }

  const displayTrack = track || Engine.lastRemoteMeta;
  const dur = displayTrack ? displayTrack.duration : 0;
  const pct = dur > 0 ? Math.min(100, (progress / dur) * 100) : 0;

  const participantList = participants.length
    ? participants.map(function (p) {
        const isRoomHost = p.isHost || p.id === Engine.hostId;
        const isSelf = Engine.peer && p.id === Engine.peer.id;
        return react.createElement("div", { key: p.id, className: "lt-p" },
          react.createElement(Avatar, { name: p.name, host: isRoomHost }),
          react.createElement("div", { className: "lt-p-info" },
            react.createElement("span", { className: "lt-p-name" }, p.name),
            react.createElement("span", { className: "lt-p-status" + (isRoomHost ? " is-host" : "") },
              isRoomHost ? "Anfitrión" : "En la sala")),
          isHost && !isRoomHost && !isSelf &&
            react.createElement("div", { className: "lt-p-actions" },
              react.createElement("button", {
                className: "lt-icon-btn",
                title: "Expulsar",
                onClick: function () { Engine.kick(p.id); }
              }, icon("ban", 14)),
              react.createElement("button", {
                className: "lt-icon-btn",
                title: "Hacer anfitrión",
                onClick: function () {
                  if (window.confirm("¿Transferir el control de la sala a " + p.name + "?")) {
                    Engine.transferHost(p.id);
                  }
                }
              }, icon("crown", 14)))
        );
      })
    : react.createElement("div", { className: "lt-empty" }, "Aún no hay nadie más en la sala");

  const stage = react.createElement("div", { className: "lt-stage" },
    displayTrack
      ? react.createElement("div", { className: "lt-track" },
          displayTrack.art
            ? react.createElement("img", { className: "lt-art", src: displayTrack.art, alt: "" })
            : react.createElement("div", { className: "lt-art lt-art-ph" }, icon("music", 54)),
          react.createElement("div", { className: "lt-meta" },
            react.createElement("div", { className: "lt-track-name" }, displayTrack.name),
            react.createElement("div", { className: "lt-track-art" }, displayTrack.artists),
            displayTrack.album && react.createElement("div", { className: "lt-track-alb" }, displayTrack.album)))
      : react.createElement("div", { className: "lt-track lt-track-empty" },
          react.createElement("div", { className: "lt-art lt-art-ph" }, icon("music", 54)),
          react.createElement("div", { className: "lt-meta" },
            react.createElement("div", { className: "lt-track-name" }, "Nada reproduciéndose"),
            react.createElement("div", { className: "lt-track-art" },
              isHost ? "Pon una canción y todos la seguirán" : "Esperando al anfitrión"))),
    react.createElement("div", { className: "lt-player" },
      react.createElement("div", { className: "lt-bar" },
        react.createElement("div", { className: "lt-bar-fill", style: { width: pct + "%" } }),
        react.createElement("input", {
          type: "range",
          min: 0,
          max: dur || 0,
          value: Math.min(progress, dur || 0),
          disabled: !isHost,
          onChange: function (e) { doSeek(Number(e.target.value)); },
          className: "lt-range"
        })),
      react.createElement("div", { className: "lt-time" },
        react.createElement("span", null, fmt(progress)),
        react.createElement("span", null, fmt(dur))),
      react.createElement("div", { className: "lt-controls" },
        react.createElement("button", {
          className: "lt-play",
          onClick: togglePlay,
          disabled: !isHost,
          title: isHost ? "Controlar la sala" : "Solo el anfitrión controla"
        }, iconFill(playing ? "pause" : "play", 24)),
        react.createElement("div", { className: "lt-host-hint" },
          isHost ? "Tú controlas la sala" : "Sincronizado con el anfitrión")))
  );

  const side = react.createElement("div", { className: "lt-side" },
    react.createElement("div", { className: "lt-panel" },
      react.createElement("div", { className: "lt-panel-h" },
        icon("users", 15),
        react.createElement("h3", null, "En la sala"),
        react.createElement("span", { className: "lt-count" }, participants.length)),
      react.createElement("div", { className: "lt-ps" }, participantList)),
    react.createElement("div", { className: "lt-panel lt-chat" + (chatOpen ? "" : " collapsed") },
      react.createElement("div", {
        className: "lt-panel-h lt-chat-toggle",
        onClick: function () { setChatOpen(!chatOpen); }
      },
        icon("message", 15),
        react.createElement("h3", null, "Chat")),
      chatOpen && react.createElement("div", { className: "lt-chat-log" },
        chat.length === 0 && react.createElement("div", { className: "lt-empty" }, "Aún no hay mensajes"),
        chat.map(function (m, i) {
          return react.createElement("div", { key: i, className: "lt-msg" },
            react.createElement("b", null, m.from),
            react.createElement("span", null, m.text));
        }),
        react.createElement("div", { ref: chatEndRef })),
      chatOpen && react.createElement("form", { className: "lt-chat-in", onSubmit: sendChat },
        react.createElement("input", {
          type: "text",
          value: chatInput,
          placeholder: "Escribe un mensaje…",
          onChange: function (e) { setChatInput(e.target.value); }
        }),
        react.createElement("button", { type: "submit", className: "lt-send", title: "Enviar" }, icon("send", 16)))
    )
  );

  return react.createElement("div", { className: "lt-app lt-room" },
    react.createElement("div", { className: "lt-topbar" },
      react.createElement("div", { className: "lt-room-title" },
        react.createElement("h2", null, roomName || "Sala"),
        react.createElement("span", { className: "lt-live" },
          react.createElement("i", { className: "lt-dot" }),
          "EN DIRECTO")),
      react.createElement("div", { className: "lt-top-actions" },
        react.createElement("button", { className: "lt-code-chip", onClick: copyInvite, title: "Copiar invitación" },
          react.createElement("span", null, roomCode),
          copied ? icon("check", 15) : icon("copy", 15),
          react.createElement("b", null, copied ? "Copiado" : "Copiar")),
        react.createElement("button", { className: "lt-icon-btn lt-leave", onClick: resetToLobby, title: "Salir" }, icon("x", 16)))),
    notice && react.createElement("div", { className: "lt-notice" }, notice),
    react.createElement("div", { className: "lt-room-grid" }, stage, side)
  );
}

function render() {
  return react.createElement(App);
}
