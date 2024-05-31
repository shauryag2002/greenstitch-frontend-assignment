import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './App.css';
const App = () => {
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState(
    []
  );
  const [completedTasks, setCompletedTasks] = useState(
    []
  );
  const updateLocalStorage = (pendingTasks, inProgressTasks, completedTasks) => {
    localStorage.setItem('taskData', JSON.stringify({ pendingTasks, inProgressTasks, completedTasks }));
  };
  const moveToInProgress = (index) => {
    const task = pendingTasks[index];
    const newPendingTasks = pendingTasks.filter((_, i) => i !== index);
    const newInProgressTasks = [...inProgressTasks, task];
    setPendingTasks(newPendingTasks);
    setInProgressTasks(newInProgressTasks);
    localStorage.setItem('taskData', JSON.stringify({ pendingTasks: newPendingTasks, inProgressTasks: newInProgressTasks, completedTasks }));
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const reorder = (list, startIndex, endIndex) => {
      const [removed] = list.splice(startIndex, 1);
      list.splice(endIndex, 0, removed);
      return list;
    };

    const move = (sourceList, destList, startIndex, endIndex) => {
      const [removed] = sourceList.splice(startIndex, 1);
      destList.splice(endIndex, 0, removed);
      return [sourceList, destList];
    };

    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'pending') {
        const newPendingTasks = reorder([...pendingTasks], source.index, destination.index);
        setPendingTasks(newPendingTasks);
        updateLocalStorage(newPendingTasks, inProgressTasks, completedTasks);
      } else if (source.droppableId === 'inProgress') {
        const newInProgressTasks = reorder([...inProgressTasks], source.index, destination.index);
        setInProgressTasks(newInProgressTasks);
        updateLocalStorage(pendingTasks, newInProgressTasks, completedTasks);
      } else if (source.droppableId === 'completed') {
        const newCompletedTasks = reorder([...completedTasks], source.index, destination.index);
        setCompletedTasks(newCompletedTasks);
        updateLocalStorage(pendingTasks, inProgressTasks, newCompletedTasks);
      }
    } else {
      if (source.droppableId === 'pending' && destination.droppableId === 'inProgress') {
        const [newPendingTasks, newInProgressTasks] = move([...pendingTasks], [...inProgressTasks], source.index, destination.index);
        setPendingTasks(newPendingTasks);
        setInProgressTasks(newInProgressTasks);
        updateLocalStorage(newPendingTasks, newInProgressTasks, completedTasks);
      } else if (source.droppableId === 'inProgress' && destination.droppableId === 'completed') {
        const [newInProgressTasks, newCompletedTasks] = move([...inProgressTasks], [...completedTasks], source.index, destination.index);
        setInProgressTasks(newInProgressTasks);
        setCompletedTasks(newCompletedTasks.map(task => ({
          ...task,
          timestamp: new Date().toLocaleString()
        })));
        updateLocalStorage(pendingTasks, newInProgressTasks, newCompletedTasks);
      }
    }
  };
  const [isFormVisible, setFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const RandomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };
  const handleCreateIssue = () => {
    if (title && description) {
      const newIssue = {
        id: RandomId(),
        title,
        description,
      };
      setPendingTasks([...pendingTasks, newIssue]);
      setTitle('');
      setDescription('');
      setFormVisible(false);
    }
  };
  useEffect(() => {
    const data = localStorage.getItem('taskData');
    if (data) {
      const taskData = JSON.parse(data);
      setPendingTasks(taskData.pendingTasks ?? []);
      setInProgressTasks(taskData.inProgressTasks ?? []);
      setCompletedTasks(taskData.completedTasks ?? []);
    }
  }, []);
  useEffect(() => {
    updateLocalStorage(pendingTasks, inProgressTasks, completedTasks);
  }, [pendingTasks, inProgressTasks, completedTasks]);
  const capitalizeFirstLetter = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="task-board">
        {isFormVisible && (
          <div className="modal">
            <div className="modal-content">
              <h3>Create Issue</h3>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button onClick={handleCreateIssue}>Create</button>
              <button onClick={() => setFormVisible(false)}>Cancel</button>
            </div>
          </div>
        )}
        <Droppable droppableId="pending">
          {(provided) => (
            <div className="task-column" {...provided.droppableProps} ref={provided.innerRef}>
              <h2>To Do{" "}
                <span className='issue-count'>{pendingTasks.length} {pendingTasks.length > 1 ? "ISSUES" : "ISSUE"}
                </span>
              </h2>
              {pendingTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div className="task-card" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <p className='font-bold font-large'>{capitalizeFirstLetter(task.title)}</p>
                      <p><span className='font-bold'>Description</span>: {capitalizeFirstLetter(task.description)}</p>
                      <button
                        onClick={
                          () => moveToInProgress(index)
                        }
                      >Start</button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <button className="create-issue" onClick={() => setFormVisible(true)}>+ Create issue</button>

            </div>
          )}
        </Droppable>
        <Droppable droppableId="inProgress">
          {(provided) => (
            <div className="task-column" {...provided.droppableProps} ref={provided.innerRef}>
              <h2>In Progress{" "}
                <span className='issue-count'>{inProgressTasks.length} {inProgressTasks.length > 1 ? "ISSUES" : "ISSUE"}</span>

              </h2>
              {inProgressTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div className="task-card" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <p className='font-bold font-large'>{capitalizeFirstLetter(task.title)}</p>
                      <p><span className='font-bold'>Description</span>:{capitalizeFirstLetter(task.description)}</p>
                      <button
                        onClick={
                          () =>
                            onDragEnd({
                              source: { droppableId: 'inProgress', index: index },
                              destination: { droppableId: 'completed', index: completedTasks.length },
                            })

                        }
                      >Complete</button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <Droppable droppableId="completed">
          {(provided) => (
            <div className="task-column" {...provided.droppableProps} ref={provided.innerRef}>
              <h2>Done</h2>
              {completedTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div className="task-card" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <p className='font-bold font-large'>{capitalizeFirstLetter(task.title)}</p>
                      <p><span className='font-bold'>Description</span>: {capitalizeFirstLetter(task.description)}</p>
                      <p>Completed at: {task.timestamp}</p>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
};

export default App;
