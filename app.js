// Simple roster availability script
// Usage: open index.html in a browser (same folder) and use the UI.

(() => {
  const namesInput = document.getElementById('namesInput');
  const loadBtn = document.getElementById('loadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const markAllBtn = document.getElementById('markAllBtn');
  const unmarkAllBtn = document.getElementById('unmarkAllBtn');
  const exportBtn = document.getElementById('exportBtn');
  const showAvailableOnly = document.getElementById('showAvailableOnly');
  const playersList = document.getElementById('playersList');
  const totalCountEl = document.getElementById('totalCount');
  const availableCountEl = document.getElementById('availableCount');
  const messageEl = document.getElementById('message');
  const coachesInput = document.getElementById('coachesInput');
  const loadCoachesBtn = document.getElementById('loadCoachesBtn');
  const startDraftBtn = document.getElementById('startDraftBtn');
  const nextPickBtn = document.getElementById('nextPickBtn');
  const currentCoachEl = document.getElementById('currentCoach');
  const rostersEl = document.getElementById('rosters');


  document.getElementById('showDraftBtn').addEventListener('click', function() {
    const playerInput = document.getElementById('namesInput').value;
    const coachInput = document.getElementById('coachesInput').value;
    const draftDiv = document.getElementById('draftOrderList');

    // Parse names
    const parseNames = str => str
        .split(/[\n,;]+/)
        .map(s => s.trim())
        .filter(Boolean);

    const players = parseNames(playerInput);
    const coaches = parseNames(coachInput);

    if (players.length === 0 || coaches.length === 0) {
        draftDiv.innerHTML = '<span style="color:red;">Please enter both player and coach names.</span>';
        return;
    }

    // Snake draft logic
    let html = '<h3>Draft Order</h3><ol>';
    const numCoaches = coaches.length;
    players.forEach((player, pickNum) => {
        const roundNum = Math.floor(pickNum / numCoaches);
        const indexInRound = pickNum % numCoaches;
        const coach = (roundNum % 2 === 0)
            ? coaches[indexInRound]
            : coaches.slice().reverse()[indexInRound];
        html += `<li>Pick ${pickNum + 1}: <strong>${coach}</strong> selects <strong>${player}</strong></li>`;
    });
    html += '</ol>';
    draftDiv.innerHTML = html;
});

  let players = []; // { name: string, status: 'available' | 'drafted', coach: string | null }
  let coaches = [];
  let coachRosters = {};
  let currentCoachIndex = 0;
  let draftStarted = false;

  function parseNames(input) {
    if (!input) return [];
    // split on newlines, commas, semicolons, pipes, or tabs
    return Array.from(new Set(
      input
        .split(/[\n,;|\t]+/)
        .map(s => s.trim())
        .filter(Boolean)
    ));
  }

  function renderPlayers() {
    playersList.innerHTML = '';
    const showOnly = showAvailableOnly.checked;
    const list = players.filter(p => (!showOnly) || p.status === 'available');

    if (list.length === 0) {
      playersList.innerHTML = '<div class="small">No players to show.</div>';
    } else {
      const fragment = document.createDocumentFragment();
      list.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'player';
        if (p.status === 'available' && draftStarted) {
          const draftBtn = document.createElement('button');
          draftBtn.textContent = 'Draft';
          draftBtn.addEventListener('click', () => selectPlayer(p.name));
          row.appendChild(draftBtn);
        } else if (p.status === 'drafted') {
          const draftedDiv = document.createElement('div');
          draftedDiv.textContent = `Drafted by ${p.coach}`;
          draftedDiv.className = 'small';
          row.appendChild(draftedDiv);
        }
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = p.name;
        row.appendChild(checkbox);
        row.appendChild(nameDiv);
        fragment.appendChild(row);
      });
      playersList.appendChild(fragment);
    }
    updateCounts();
  }

  function onAvailabilityChange(e) {
    const idx = Number(e.target.dataset.index);
    if (!Number.isNaN(idx) && players[idx]) {
      players[idx].available = e.target.checked;
      updateCounts();
    }
  }

  function updateCounts() {
    const total = players.length;
    const available = players.filter(p => p.status === 'available').length;
    totalCountEl.textContent = total;
    availableCountEl.textContent = available;
    messageEl.textContent = available > 0 ? `${available} available` : '';
  }

  function selectPlayer(playerName) {
    const player = players.find(p => p.name === playerName && p.status === 'available');
    if (!player) return;
    const coach = coaches[currentCoachIndex];
    player.status = 'drafted';
    player.coach = coach;
    coachRosters[coach].push(playerName);
    renderPlayers();
    renderRosters();
    nextPickBtn.click(); // auto next pick
  }

  function updateCurrentCoach() {
    const coach = coaches[currentCoachIndex] || 'None';
    currentCoachEl.textContent = coach;
  }

  function renderRosters() {
    rostersEl.innerHTML = '';
    if (coaches.length === 0) return;
    const fragment = document.createDocumentFragment();
    coaches.forEach(coach => {
      const div = document.createElement('div');
      div.className = 'roster';
      div.innerHTML = `<h3>${coach}</h3><ul>${coachRosters[coach].map(name => `<li>${name}</li>`).join('')}</ul>`;
      fragment.appendChild(div);
    });
    rostersEl.appendChild(fragment);
  }

  loadBtn.addEventListener('click', () => {
    const raw = namesInput.value;
    const parsed = parseNames(raw);
    players = parsed.map(name => ({ name, status: 'available', coach: null }));
    renderPlayers();
    renderRosters();
    // optional: clear input after loading
    // namesInput.value = '';
  });

  loadCoachesBtn.addEventListener('click', () => {
    const raw = coachesInput.value;
    const parsed = parseNames(raw);
    coaches = parsed;
    coachRosters = {};
    coaches.forEach(coach => coachRosters[coach] = []);
    renderRosters();
  });

  startDraftBtn.addEventListener('click', () => {
    if (coaches.length === 0) {
      alert('Load coaches first.');
      return;
    }
    draftStarted = true;
    currentCoachIndex = 0;
    updateCurrentCoach();
    renderPlayers();
  });

  nextPickBtn.addEventListener('click', () => {
    if (!draftStarted) return;
    currentCoachIndex = (currentCoachIndex + 1) % coaches.length;
    updateCurrentCoach();
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all loaded players?')) return;
    players = [];
    coaches = [];
    coachRosters = {};
    draftStarted = false;
    currentCoachIndex = 0;
    updateCurrentCoach();
    renderPlayers();
    renderRosters();
    messageEl.textContent = '';
  });

  showAvailableOnly.addEventListener('change', renderPlayers);

  // Allow pressing Ctrl+Enter (Cmd+Enter on macOS) in textarea to load quickly
  namesInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      loadBtn.click();
    }
  });

  // initial render
 
  (() => {
  const namesInput = document.getElementById('namesInput');
  const loadBtn = document.getElementById('loadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const markAllBtn = document.getElementById('markAllBtn');
  const unmarkAllBtn = document.getElementById('unmarkAllBtn');
  const exportBtn = document.getElementById('exportBtn');
  const showAvailableOnly = document.getElementById('showAvailableOnly');
  const playersList = document.getElementById('playersList');
  const totalCountEl = document.getElementById('totalCount');
  const availableCountEl = document.getElementById('availableCount');
  const messageEl = document.getElementById('message');

  // Fallback containers present in index.html: .controls and .toolbar
  const controlsDiv = document.querySelector('.controls');
  const toolbarDiv = document.querySelector('.toolbar');

  let players = []; // { name: string, available: boolean, assignedTo: coachId|null }
  let coaches = []; // { id: number, name: string, picks: string[] }
  let currentCoachIndex = 0; // index in coaches array (whose turn it is)

  function parseNames(input) {
    if (!input) return [];
    // split on newlines, commas, semicolons, pipes, or tabs
    return Array.from(new Set(
      input
        .split(/[\n,;|\t]+/)
        .map(s => s.trim())
        .filter(Boolean)
    ));
  }

  // --- Coach UI & logic ---
  function addCoach(name) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    coaches.push({ id, name: name || `Coach ${coaches.length + 1}`, picks: [] });
    // if first coach added, ensure currentCoachIndex is valid
    if (coaches.length === 1) currentCoachIndex = 0;
    renderCoaches();
    renderPlayers();
  }

  function removeCoach(id) {
    const idx = coaches.findIndex(c => c.id === id);
    if (idx === -1) return;
    // unassign players assigned to this coach
    players.forEach(p => { if (p.assignedTo === id) p.assignedTo = null; });
    coaches.splice(idx, 1);
    if (currentCoachIndex >= coaches.length) currentCoachIndex = Math.max(0, coaches.length - 1);
    renderCoaches();
    renderPlayers();
  }

  function selectCoach(index) {
    if (index < 0 || index >= coaches.length) return;
    currentCoachIndex = index;
    renderCoaches();
  }

  function nextCoachTurn() {
    if (coaches.length === 0) return;
    currentCoachIndex = (currentCoachIndex + 1) % coaches.length;
    renderCoaches();
  }

  function assignPlayerToCurrentCoach(playerIdx) {
    if (!coaches.length) {
      showMessage('Add at least one coach first.');
      return;
    }
    const coach = coaches[currentCoachIndex];
    const p = players[playerIdx];
    if (!p) return;
    if (p.assignedTo === coach.id) {
      // already assigned to same coach -> unassign
      p.assignedTo = null;
      coach.picks = coach.picks.filter(n => n !== p.name);
    } else {
      // if assigned to another coach, remove from previous
      if (p.assignedTo != null) {
        const prev = coaches.find(c => c.id === p.assignedTo);
        if (prev) prev.picks = prev.picks.filter(n => n !== p.name);
      }
      p.assignedTo = coach.id;
      // avoid duplicates
      if (!coach.picks.includes(p.name)) coach.picks.push(p.name);
    }
    renderCoaches();
    renderPlayers();
  }

  function unassignPickFromCoach(coachId, playerName) {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return;
    coach.picks = coach.picks.filter(n => n !== playerName);
    const p = players.find(x => x.name === playerName);
    if (p) p.assignedTo = null;
    renderCoaches();
    renderPlayers();
  }

  // --- Rendering ---
  function renderCoaches() {
    // create a container in toolbar if not present
    let coachesContainer = document.getElementById('coachesContainer');
    if (!coachesContainer) {
      coachesContainer = document.createElement('div');
      coachesContainer.id = 'coachesContainer';
      coachesContainer.style.display = 'flex';
      coachesContainer.style.gap = '12px';
      coachesContainer.style.flexWrap = 'wrap';
      toolbarDiv && toolbarDiv.appendChild(coachesContainer);
    }
    coachesContainer.innerHTML = '';

    coaches.forEach((c, idx) => {
      const card = document.createElement('div');
      card.className = 'coach-card';
      card.style.border = (idx === currentCoachIndex) ? '2px solid #146' : '1px solid #ddd';
      card.style.padding = '8px';
      card.style.borderRadius = '6px';
      card.style.minWidth = '140px';
      card.style.background = '#fff';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';

      const nameBtn = document.createElement('button');
      nameBtn.textContent = c.name + ` (${c.picks.length})`;
      nameBtn.style.cursor = 'pointer';
      nameBtn.onclick = () => selectCoach(idx);

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.style.marginLeft = '8px';
      removeBtn.onclick = () => {
        if (confirm(`Remove ${c.name}? This will unassign their picks.`)) removeCoach(c.id);
      };

      header.appendChild(nameBtn);
      header.appendChild(removeBtn);
      card.appendChild(header);

      const picksList = document.createElement('div');
      picksList.style.marginTop = '8px';
      if (c.picks.length === 0) {
        picksList.innerHTML = '<div class="small">No picks yet</div>';
      } else {
        c.picks.forEach(name => {
          const p = document.createElement('div');
          p.style.display = 'flex';
          p.style.justifyContent = 'space-between';
          p.style.alignItems = 'center';
          p.style.gap = '8px';
          p.textContent = name;
          const unassign = document.createElement('button');
          unassign.textContent = 'X';
          unassign.style.marginLeft = '8px';
          unassign.onclick = () => unassignPickFromCoach(c.id, name);
          p.appendChild(unassign);
          picksList.appendChild(p);
        });
      }
      card.appendChild(picksList);

      coachesContainer.appendChild(card);
    });

    // update a small "turn" indicator
    let turnEl = document.getElementById('turnIndicator');
    if (!turnEl) {
      turnEl = document.createElement('div');
      turnEl.id = 'turnIndicator';
      turnEl.style.marginTop = '8px';
      toolbarDiv && toolbarDiv.appendChild(turnEl);
    }
    turnEl.textContent = coaches.length ? `Current pick: ${coaches[currentCoachIndex].name}` : 'No coaches';
  }

  function renderPlayers() {
    playersList.innerHTML = '';
    const list = players; // show all players; assigned players are marked

    if (list.length === 0) {
      playersList.innerHTML = '<div class="small">No players to show.</div>';
    } else {
      const fragment = document.createDocumentFragment();
      list.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'player';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '12px';
        row.style.padding = '6px 0';
        row.style.borderBottom = '1px dashed #f0f0f0';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = p.name;
        nameDiv.style.flex = '1';
        nameDiv.style.cursor = coaches.length ? 'pointer' : 'default';
        // clicking the name assigns/unassigns to current coach if coaches exist
        nameDiv.onclick = () => {
          if (!coaches.length) {
            showMessage('Add a coach (use "Add Coach") before picking.');
            return;
          }
          assignPlayerToCurrentCoach(idx);
        };

        const status = document.createElement('div');
        status.style.minWidth = '120px';
        if (p.assignedTo == null) {
          status.textContent = p.available ? 'Available' : 'Unavailable';
        } else {
          const coach = coaches.find(c => c.id === p.assignedTo);
          status.textContent = coach ? `Picked by ${coach.name}` : 'Assigned';
        }

        row.appendChild(nameDiv);
        row.appendChild(status);
        fragment.appendChild(row);
      });
      playersList.appendChild(fragment);
    }
    updateCounts();
  }

  function updateCounts() {
    const total = players.length;
    const available = players.filter(p => p.available && p.assignedTo == null).length;
    if (totalCountEl) totalCountEl.textContent = total;
    if (availableCountEl) availableCountEl.textContent = available;
    if (messageEl) messageEl.textContent = available > 0 ? `${available} available (unassigned)` : '';
  }

  function showMessage(txt) {
    if (messageEl) {
      messageEl.textContent = txt;
      setTimeout(() => { if (messageEl) messageEl.textContent = ''; }, 3000);
    } else {
      console.log(txt);
    }
  }

  // --- Wire up existing controls robustly (guard nulls) ---
  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      const raw = namesInput.value;
      const parsed = parseNames(raw);
      players = parsed.map(name => ({ name, available: false, assignedTo: null }));
      renderPlayers();
    });
  } else {
    // If there's no load button in the HTML, support Ctrl/Cmd+Enter in textarea to load
    namesInput && namesInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const raw = namesInput.value;
        const parsed = parseNames(raw);
        players = parsed.map(name => ({ name, available: false, assignedTo: null }));
        renderPlayers();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear all loaded players?')) return;
      players = [];
      renderPlayers();
      if (messageEl) messageEl.textContent = '';
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      players.forEach(p => p.available = true);
      renderPlayers();
    });
  }

  if (unmarkAllBtn) {
    unmarkAllBtn.addEventListener('click', () => {
      players.forEach(p => p.available = false);
      renderPlayers();
    });
  }

  if (showAvailableOnly) {
    showAvailableOnly.addEventListener('change', renderPlayers);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const availableNames = players.filter(p => p.available && p.assignedTo == null).map(p => p.name);
      if (availableNames.length === 0) {
        alert('No available (unassigned) players to export.');
        return;
      }
      const text = availableNames.join('\n');
      try {
        await navigator.clipboard.writeText(text);
        showMessage('Available players copied to clipboard.');
      } catch (err) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'available-players.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showMessage('Downloaded available players as a text file.');
      }
    });
  }

  // --- Build coach controls in the .controls area so user can interact without editing HTML ---
  function ensureCoachControls() {
    if (!controlsDiv) return;
    // Add Coach button
    if (!document.getElementById('addCoachBtn')) {
      const addCoachBtn = document.createElement('button');
      addCoachBtn.id = 'addCoachBtn';
      addCoachBtn.textContent = 'Add Coach';
      addCoachBtn.onclick = () => {
        const name = prompt('Coach name (leave blank for default):');
        addCoach(name ? name.trim() : undefined);
      };
      controlsDiv.appendChild(addCoachBtn);
    }

    if (!document.getElementById('nextCoachBtn')) {
      const nextBtn = document.createElement('button');
      nextBtn.id = 'nextCoachBtn';
      nextBtn.textContent = 'Next Coach';
      nextBtn.onclick = nextCoachTurn;
      controlsDiv.appendChild(nextBtn);
    }

    if (!document.getElementById('clearCoachesBtn')) {
      const clearCoaches = document.createElement('button');
      clearCoaches.id = 'clearCoachesBtn';
      clearCoaches.textContent = 'Clear Coaches';
      clearCoaches.onclick = () => {
        if (!confirm('Remove all coaches and unassign picks?')) return;
        coaches = [];
        players.forEach(p => p.assignedTo = null);
        currentCoachIndex = 0;
        renderCoaches();
        renderPlayers();
      };
      controlsDiv.appendChild(clearCoaches);
    }

    if (!document.getElementById('autoAssignBtn')) {
      const autoAssign = document.createElement('button');
      autoAssign.id = 'autoAssignBtn';
      autoAssign.textContent = 'Auto-assign remaining (round-robin)';
      autoAssign.onclick = () => {
        if (coaches.length === 0) { showMessage('Add coaches first.'); return; }
        // assign all unassigned players round-robin starting at currentCoachIndex
        let coachIdx = currentCoachIndex;
        players.forEach(p => {
          if (p.assignedTo == null) {
            const coach = coaches[coachIdx];
            p.assignedTo = coach.id;
            if (!coach.picks.includes(p.name)) coach.picks.push(p.name);
            coachIdx = (coachIdx + 1) % coaches.length;
          }
        });
        renderCoaches();
        renderPlayers();
      };
      controlsDiv.appendChild(autoAssign);
    }
  }

  // initial setup
  ensureCoachControls();
  renderCoaches();
  renderPlayers();
})()})();