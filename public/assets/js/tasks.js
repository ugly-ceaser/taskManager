// Global tasks array
let tasks = [];

// Status badge helper
function getStatusBadgeClass(status) {
    switch(status) {
        case 'pending': return 'status-pending';
        case 'in-progress': return 'status-in-progress';
        case 'completed': return 'status-completed';
        default: return '';
    }
}

// Update the helper function to handle different date types
function getRelativeDays(dateString, isEndDate = false) {
    if (!dateString) return '';
    
    // Ensure we're working with a valid date string
    let date;
    try {
        // Handle both ISO strings and date objects
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return '';
        }
    } catch (error) {
        console.error('Date parsing error:', error);
        return '';
    }

    // Set times to midnight for accurate day comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isEndDate) {
        // Format for end dates (future-focused)
        if (diffDays === 0) return 'Due Today';
        if (diffDays === 1) return 'Due Tomorrow';
        if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
        return `Due in ${diffDays} days`;
    } else {
        // Format for creation dates (past-focused)
        if (diffDays === 0) return 'Created Today';
        if (diffDays === -1) return 'Created Yesterday';
        if (diffDays === 1) return 'Created Tomorrow'; // Edge case
        if (diffDays < 0) return `Created ${Math.abs(diffDays)} days ago`;
        return `Created ${diffDays} days ago`;
    }
}

// Make functions globally available
window.addNewTask = function() {
    const modal = document.getElementById('addTaskModal');
    modal.style.display = "block";
};

window.editTask = function(taskId) {
    console.log('Tasks array:', tasks);
    console.log('Looking for taskId:', taskId);
    
    const task = tasks.find(t => {
        console.log('Comparing:', t._id, taskId);
        return t._id === taskId;
    });
    
    console.log('Found task:', task);
    
    if (task) {
        const taskToEdit = {
            ...task,
            id: task._id
        };
        console.log('Task to edit:', taskToEdit);
        localStorage.setItem('taskToEdit', JSON.stringify(taskToEdit));
        window.location.href = `edit-task.html?id=${task._id}`;
    } else {
        console.error('Task not found');
    }
};

window.deleteTask = async function(taskId) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({
                title: 'Deleting task...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            console.log('Deleting task with ID:', taskId);

            const response = await axios.delete(`/api/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Delete response:', response);

            await fetchTasks();

            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Your task has been deleted.',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('Error details:', error.response?.data);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }

            let errorMessage = 'Failed to delete task. Please try again.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            console.error('Error deleting task:', errorMessage);
            
            await Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMessage,
            });
        }
    }
};

// Add these sanitization helper functions
function sanitizeString(str) {
    if (!str) return '';
    // Remove HTML tags and special characters
    return str.replace(/<[^>]*>/g, '')  // Remove HTML tags
              .replace(/[&<>"'`=\/]/g, '') // Remove special characters
              .trim();
}

function sanitizeNumber(num) {
    // Ensure it's a valid number and within safe bounds
    const parsed = parseInt(num);
    if (isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, Number.MAX_SAFE_INTEGER));
}

function sanitizeDate(dateStr) {
    if (!dateStr) return '';
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return '';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ''; // Invalid date
    
    // Return formatted date string
    return date.toISOString().split('T')[0];
}

// Update the validation helper function
function validateTaskForm(formData) {
    const errors = [];
    
    // Sanitize inputs
    formData.description = sanitizeString(formData.description);
    formData.endDate = sanitizeDate(formData.endDate);
    formData.duration = sanitizeNumber(formData.duration);
    
    // Description validation
    if (!formData.description || formData.description.length === 0) {
        errors.push('Description is required');
    } else if (formData.description.length < 3) {
        errors.push('Description must be at least 3 characters long');
    } else if (formData.description.length > 500) { // Add reasonable maximum length
        errors.push('Description must not exceed 500 characters');
    }
    
    // End date validation
    if (!formData.endDate) {
        errors.push('End date is required');
    } else {
        const endDate = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (endDate < today) {
            errors.push('End date cannot be in the past');
        }
    }
    
    // Duration validation
    if (formData.duration < 0) {
        errors.push('Duration cannot be negative');
    } else if (formData.duration > 168) {
        errors.push('Duration cannot exceed 168 hours (1 week)');
    }
    
    return errors;
}

// Update the add task form submission
document.getElementById('addTaskForm').onsubmit = async function(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const newTask = {
        description: sanitizeString(document.getElementById('description').value),
        endDate: sanitizeDate(document.getElementById('endDate').value),
        duration: sanitizeNumber(document.getElementById('duration').value)
    };

    // Validate form data
    const validationErrors = validateTaskForm(newTask);
    if (validationErrors.length > 0) {
        await Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            html: validationErrors.join('<br>'),
        });
        return;
    }

    try {
        Swal.fire({
            title: 'Adding task...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        await axios.post('/api/tasks', newTask, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        document.getElementById('addTaskModal').style.display = "none";
        document.getElementById('addTaskForm').reset();
        await fetchTasks();

        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Task has been added successfully',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return;
        }
        console.error('Error adding task:', error.response?.data?.message || error.message);
        
        await Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to add task. Please try again.',
        });
    }
};

// Update the checkForUpdatedTask function
async function checkForUpdatedTask() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const updatedTask = localStorage.getItem('updatedTask');
    if (updatedTask) {
        try {
            let taskData = JSON.parse(updatedTask);
            
            // Sanitize the task data
            taskData = {
                ...taskData,
                description: sanitizeString(taskData.description),
                endDate: sanitizeDate(taskData.endDate),
                duration: sanitizeNumber(taskData.duration),
                progress: sanitizeNumber(taskData.progress),
                status: ['pending', 'in-progress', 'completed'].includes(taskData.status) 
                    ? taskData.status 
                    : 'pending'
            };
            
            // Validate form data
            const validationErrors = validateTaskForm(taskData);
            if (validationErrors.length > 0) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Validation Error',
                    html: validationErrors.join('<br>'),
                });
                return;
            }

            Swal.fire({
                title: 'Updating task...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const { id, _id, ...updateData } = taskData;

            console.log('Sending update request for task:', taskId);
            console.log('Update data:', updateData);

            await axios.put(`/api/tasks/${taskId}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            await fetchTasks();
            localStorage.removeItem('updatedTask');
            localStorage.removeItem('taskToEdit');

            await Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Task has been updated successfully',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('Error updating task:', error);
            console.error('Error details:', error.response?.data);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }

            await Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.message || 'Failed to update task. Please try again.',
            });
        }
    }
}

// Update the renderTasks function to properly handle dates
function renderTasks() {
    const tableBody = document.getElementById('taskTableBody');
    if (!Array.isArray(tasks) || tasks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No tasks found</td></tr>';
        return;
    }

    tableBody.innerHTML = tasks.map(task => {
        // Debug logging
        console.log('Task dates:', {
            dateCreated: task.dateCreated,
            endDate: task.endDate
        });

        return `
            <tr>
                <td>${sanitizeString(task.description) || ''}</td>
                <td>${sanitizeNumber(task.progress)}%</td>
                <td>${getRelativeDays(task.dateCreated, false)}</td>
                <td>${getRelativeDays(task.endDate, true)}</td>
                <td>${sanitizeNumber(task.duration)}</td>
                <td>
                    <span class="status-badge ${getStatusBadgeClass(task.status)}">
                        ${sanitizeString(task.status) || 'pending'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-edit" onclick="editTask('${sanitizeString(task._id)}')">Edit</button>
                    <button class="btn btn-delete" onclick="deleteTask('${sanitizeString(task._id)}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Add this debug logging to fetchTasks
async function fetchTasks() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await axios.get('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Debug logging
        console.log('Fetched tasks:', response.data);
        
        // Ensure dates are properly formatted
        tasks = response.data.map(task => ({
            ...task,
            dateCreated: task.dateCreated ? new Date(task.dateCreated).toISOString() : null,
            endDate: task.endDate ? new Date(task.endDate).toISOString() : null
        }));
        
        renderTasks();
    } catch (error) {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return;
        }
        console.error('Error fetching tasks:', error.response?.data?.message || error.message);
        tasks = [];
        renderTasks();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    await fetchTasks();
    await checkForUpdatedTask();
    
    // Modal event listeners
    document.querySelector('.close').onclick = function() {
        document.getElementById('addTaskModal').style.display = "none";
    };

    window.onclick = function(event) {
        const modal = document.getElementById('addTaskModal');
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}); 