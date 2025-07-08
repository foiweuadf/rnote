document.addEventListener('DOMContentLoaded', () => {
  const noteTitleInput = document.getElementById('noteTitleInput');
  const noteContentInput = document.getElementById('noteContentInput');
  const addNoteButton = document.getElementById('addNoteButton');
  const viewNotesButton = document.getElementById('viewNotesButton');
  const noteListDiv = document.getElementById('noteList');
  const loadingOverlay = document.getElementById('loadingOverlay');

  // Remote SQL API Endpoints (replace with your actual endpoints)
  const SQL_API_ENDPOINT = 'https://stirring-faun-45b7f8.netlify.app/';
  const DATABASE_URL = 'http://emuyobzniv.ccccocccc.cc';

  // Helper functions to show/hide loading overlay
  function showLoading() {
    loadingOverlay.classList.remove('hidden');
  }

  function hideLoading() {
    loadingOverlay.classList.add('hidden');
  }

  // Function to execute SQL queries against the remote API
  async function executeSql(sql, args = []) {
    showLoading(); // Show loading before executing SQL
    try {
      const requestBody = {
        url: DATABASE_URL,
        sql: sql,
      };
      if (args.length > 0) {
        requestBody.args = args;
      }

      const response = await fetch(SQL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          return result.data; // Return the 'data' array from the successful response
        } else {
          throw new Error(result.message || 'SQL execution failed with unknown error.');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    } finally {
      hideLoading(); // Hide loading after SQL execution (success or failure)
    }
  }

  // Function to display notes from remote storage
  async function displayNotes() {
    noteListDiv.innerHTML = ''; // Clear current list
    try {
      const notes = await executeSql(
        'SELECT id, title, content, ctime, mtime FROM notes ORDER BY ctime DESC'
      );

      if (notes.length === 0) {
        noteListDiv.textContent = 'No notes yet. Add one!';
        return;
      }

      notes.forEach(note => {
        const noteItemDiv = document.createElement('div');
        noteItemDiv.className = 'note-item';

        const titleElement = document.createElement('h3');
        titleElement.textContent = note.title || 'Untitled Note';

        const contentElement = document.createElement('p');
        contentElement.textContent = note.content;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'note-actions';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
          await deleteNote(note.id);
        });

        actionsDiv.appendChild(deleteButton);

        noteItemDiv.appendChild(titleElement);
        noteItemDiv.appendChild(contentElement);
        noteItemDiv.appendChild(actionsDiv);

        noteListDiv.appendChild(noteItemDiv);
      });
    } catch (error) {
      noteListDiv.textContent = `Failed to load notes: ${error.message}`;
    }
  }

  // Function to add a new note to remote storage
  addNoteButton.addEventListener('click', async () => {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (!content) {
      alert('Note content cannot be empty!');
      return;
    }

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    try {
      await executeSql(
        'INSERT INTO notes (title, content, ctime, mtime) VALUES (?, ?, ?, ?)',
        [title, content, currentTimeInSeconds, currentTimeInSeconds]
      );
      noteTitleInput.value = '';
      noteContentInput.value = '';
      displayNotes(); // Refresh the list
    } catch (error) {
      alert(`Failed to add note: ${error.message}`);
    }
  });

  // Function to delete a note from remote storage
  async function deleteNote(idToDelete) {
    try {
      await executeSql(
        'DELETE FROM notes WHERE id = ?',
        [idToDelete]
      );
      displayNotes(); // Refresh the list
    } catch (error) {
      alert(`Failed to delete note: ${error.message}`);
    }
  }

  // Event listener for pressing Ctrl+Enter in title or content input
  noteTitleInput.addEventListener('keydown', handleCtrlEnter);
  noteContentInput.addEventListener('keydown', handleCtrlEnter);

  function handleCtrlEnter(event) {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault(); // Prevent default action (e.g., new line in textarea)
      addNoteButton.click(); // Programmatically click the add note button
    }
  }

  // Event listener for viewing all notes
  viewNotesButton.addEventListener('click', displayNotes);

  // Initial display of notes when the page loads
  displayNotes();
});
