var asanaStatus = null;
var userInfo = null;

$(document).ready(function () {
    // initialize and check oauth status for asana
    $.ajax({
       url: '/api/oauth-status.php/Asana',
       type: 'GET',
       dataType: 'json',
       success: function(statusResult) {
           asanaStatus = statusResult;
           if (asanaStatus.loggedIn) {
               runApp();
           } else {
               runSignin();
           }
       },
       error: function() {
           $("#errors").text('Could not contact server.  Reload page to try again.');
       }
    });
    
    function runApp() {
        $("#app").show();

        var projects = $('#projects')
            .attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart', false);

        var tasks = $('#tasks');

        var workspaces = $("#workspaces")
            .change(function () {
                selectWorkspace($(this).val(), $(this).data('obj'));
            });
        workspaces.children('*:not(:first)').remove();
                
        // load current user info
        asana({
            url: 'users/me',
            success: function (me) {
                userInfo = me.data;
                var profile = $("#me");
                profile.find("img.photo")
                    .attr("src", userInfo.photo.image_21x21)
                    .attr("alt", 'Image of ' + userInfo.name);
                profile.find(".name")
                    .text(userInfo.name);
                userInfo.workspaces.forEach(function (w) {
                    $("#template>option.workspace").clone()
                        .appendTo(workspaces)
                        .data("obj", w)
                        .text(w.name)
                        .val(w.id);
                });
                if (localStorage['workspace']) {
                    workspaces.val(localStorage['workspace']).change();
                }
            },
            error: function() {
                $("#errors").append("Server error retrieving profile data.<br />");
            }
        }, "#me,#workspaces");
        
        function selectWorkspace(id, obj) {
            localStorage['workspace'] = id;
            projects.empty();
            tasks.empty();
            asana({
                url: 'workspaces/' + encodeURIComponent(id) + '/projects',
                type: 'GET',
                data: {
                    archived: false,
                    opt_fields: 'name,color,notes,archived,workspace'
                },
                success: function (result) {
                    result.data.forEach(function (p) {
                        var itemid = 'project_' + p.id;
                        var item = $("#template>li.project").clone()
                            .appendTo(projects)
                            .attr('id', itemid)
                            .data('id', p.id)
                            .data('obj', p)
                            .click(selectProject);
                        item.find('.check')
                            .click(checkProject);
                        item.find('label.name')
                            .text(p.name)
                            .attr('for', itemid);

                    });
                    if (localStorage['project']) {
                        projects.find("#project_" + localStorage['project']).click();
                    }
                },
                error: function() {
                    $("#errors").append("Server error retrieving workspace data.<br />");
                }
            }, "#projects");
        }

        function selectProject() {
            var item = $(this);
            item.parent().children().removeClass('active');
            item.addClass('active');
            var id = item.data('id');
            localStorage['project'] = id;
            tasks.empty();
            asana({
                url: 'projects/' + encodeURIComponent(id) + '/tasks',
                success: function (result) {
                    result.data.forEach(function (t) {
                        var item = $("#template>.task").clone()
                            .appendTo(tasks)
                            .data('obj', t);
                        item.find('.name')
                            .text(t.name);
                        item.find('.link')
                            .attr('href', '#' + t.id)
                            .click(function(e) { e.preventDefault(); });
                    });
                },
                error: function () {
                    $("#errors").append("Server error retrieving profile data.<br />");
                },
                data: {
                    opt_fields: 'name,completed,assignee,assignee_status'
                }
            }, "#tasks");
        }
        
        function checkProject(e) {
            if (e.shiftKey) {
                // check/uncheck all between checkboxes
                var check = $(this);
                var active = $('#projects .project.active');
                var activeIndex = active.index();
                if (activeIndex > -1) {
                    var myIndex = check.parent().index();
                    var start, end;
                    if (myIndex > activeIndex) {
                        start = active;
                        end = check.parent();
                    } else {
                        start = check.parent();
                        end = active;
                    }
                    var selection = start.nextUntil(end).andSelf().find('.check').prop('checked', check.prop('checked'));
                }
            }
            var checkcontext = $('#project_context .whenchecked');
            if ($('#projects .project .check:checked').size()) {
                checkcontext.show();
            } else {
                checkcontext.hide();
            }
        }
        
        var processing_modal = $('#processing_modal')
            .modal({ show: false, keyboard: false });
            
        var copyto_modal = $('#copyto_modal')
            .modal({
                show: false,
                keyboard: false
            });
        var copyto_project_list = copyto_modal.find('.projectlist');
        var copyto_workspace_choice = copyto_modal.find('.workspace_choice');
        var copyto_action = $('#copyto_action')
            .click(function () {
                var workspace = copyto_workspace_choice.val();
                var list = copyto_project_list.data('list');
                copyto_modal.modal('hide');
                processing_modal.modal('show');
                copyProjects(list, workspace, function () {
                    processing_modal.modal('hide');
                    workspaces.change();
                });
            });
        copyto_workspace_choice.change(function () {
            copyto_action.prop('disabled', $(this).val() ? false : true);
        });
        
        var delete_project_modal = $('#delete_project_modal')
            .modal({
                show: false,
                keyboard: false
            });
        var delete_project_list = delete_project_modal.find('.projectlist');
        var delete_project_action = $('#delete_project_action')
            .click(function () {
                var list = delete_project_list.data('list');
                delete_project_modal.modal('hide');
                processing_modal.modal('show');
                deleteProjects(list, function () {
                    processing_modal.modal('hide');
                    workspaces.change();
                });
            });

        var setProgress = function(progress) {
            processing_modal
                .find('.progress-bar')
                .attr('aria-valuenow', progress)
                .css('width', progress + '%')
                .children('.sr-only')
                .text(progress + '% complete');
        };

        $('#copyto').click(function () {
            // gather list of projects that are checked, to be copied
            var list = [];
            var msg = '';
            $('#projects .project .check:checked').parent().each(function () {
                var proj = $(this).data('obj');
                list.push(proj);
                msg += proj.name + "\n";
            });
            // fill in text in modal
            copyto_project_list
                .text(msg)
                .data('list', list);
            // populate project dropdown to copy to
            copyto_workspace_choice.children('*:not(:first)').remove();
            workspaces.children().clone().appendTo(copyto_workspace_choice);
            // disabled copy projects button
            copyto_action.prop('disabled', true);
            copyto_modal.modal('show');
        });
        
        $('#deleteprojects').click(function () {
            // gather list of projects that are checked, to be copied
            var list = [];
            var msg = '';
            $('#projects .project .check:checked').parent().each(function () {
                var proj = $(this).data('obj');
                list.push(proj);
                msg += proj.name + "\n";
            });
            // fill in text in modal
            delete_project_list
                .text(msg)
                .data('list', list);
            delete_project_modal.modal('show');
        });
        
        function deleteProjects(projectlist, callback) {
            // iterate over projects
            var p = 0;
            var doProject, nextProject, endProject;
            var project;
            
            doProject = function() {
                if (p >= projectlist.length) {
                    endProject();
                    return;
                }
                project = projectlist[p];
                
                //   load all tasks for project
                asana_delete_project(project.id, {
                    success: nextProject
                });
            };
            nextProject = function() {
                setProgress(Math.round(p / projectlist.length * 100));
                p++;
                doProject();
            };
            endProject = function() {
                if (callback) {
                    callback();
                }
            }
            
            // run the async workflow above
            doProject();
        }
        
        function copyProjects(projectlist, destination_workspace, callback) {
            // iterate over projects
            var p = 0;
            var doProject, doProject2, doProject3, taskProgress, nextProject, endProject;
            var project;
            var sourcetasks;
            var newproject;
            
            // for each project in projectlist
            doProject = function() {
                if (p >= projectlist.length) {
                    endProject();
                    return;
                }
                project = projectlist[p];
                
                //   load all tasks for project
                asana_get_tasks(project.id, {
                    success: doProject2
                });
            };
            doProject2 = function(taskListResult) {
                sourcetasks = taskListResult.data;
                //   create new project in workspace
                var newproj = {
                    name: project.name,
                    archived: project.archived,
                    workspace: destination_workspace
                };
                if (project.color) {
                    newproj.color = project.color;
                }
                if (project.notes) {
                    newproj.notes = project.notes;
                }
                asana({
                    url: 'projects',
                    type: 'POST',
                    data: newproj,
                    success: doProject3
                });
            };
            doProject3 = function(projectresult) {
                newproject = projectresult.data;
                // create new task in new project
                copyTasks(sourcetasks, destination_workspace, newproject.id, null, project.id, taskProgress, nextProject);
            };
                taskProgress = function(progress) {
                    var totalProgress = Math.round((progress / projectlist.length) + (p / projectlist.length * 100));
                    setProgress(totalProgress);
                };
            
            nextProject = function() {
                p++;
                setProgress(Math.round(p / projectlist.length * 100));
                doProject();
            };
            endProject = function() {
                if (callback) {
                    callback();
                }
            }
            
            // start the async workflow above
            doProject();
        }
        
        function copyTasks(sourcetasks, destination_workspace, destination_project, parent_task, source_project, progress_callback, callback) {
                //   iterate over all tasks for project
            var i = sourcetasks.length - 1;
            var doTask, doTask2, doTask3, nextTask, endTask;
            var newTask;
            var subtasks;

            // for each task in sourcetasks (in reverse)
            doTask = function() {
                if (i < 0) {
                    endTask();
                    return;
                }
                // set the parent task id if it is specified
                if (parent_task) {
                    sourcetasks[i]['parent'] = parent_task;
                } else {
                    sourcetasks[i]['parent'] = null;
                }
                // if the task is in the source project, then include it in the destination project also, otherwise don't
                var task_dest = sourcetasks[i]['projects'].some(function (item) { return item.id = source_project; }) ? destination_project : null;
                asana_create_task(destination_workspace, task_dest, sourcetasks[i], {
                    success: doTask2
                });
            };
            doTask2 = function(taskresult) {
                newTask = taskresult.data;
                // copy the comments for the task over
                copyTaskComments(sourcetasks[i].id, newTask.id, doTask3);
            };
            doTask3 = function() {
                // now copy the source task's subtasks to the new task
                // get subtasks
                asana_get_subtasks(sourcetasks[i].id, {
                    success: doTask4
                });
            };
            doTask4 = function(subtaskresult) {
                subtasks = subtaskresult.data;
                // make copies of the subtasks
                if (subtasks.length > 0) {
                    copyTasks(subtasks, destination_workspace, destination_project, newTask.id, source_project, null, nextTask);
                } else {
                    nextTask();
                }
            };
            nextTask = function() {
                if (progress_callback) {
                    var progress = Math.round((sourcetasks.length - i) / sourcetasks.length * 100);
                    progress_callback(progress);
                }
                i--;
                doTask();
            };
            endTask = function() {
                if (callback) {
                    callback();
                }
            };
            
            doTask();
        }
        
        function copyTaskComments(sourcetask, destination_task, callback) {
            var c = 0;
            var doComment, doComment2, doComment3, nextComment, endComment;
            var comments;
            doComment = function() {
                // get list of comments
                asana_get_stories(sourcetask, { success: doComment2 });
            };
            doComment2 = function(storiesResult) {
                comments = storiesResult.data.filter(function (item) { return item.type == 'comment'; });
                doComment3();
            };
                doComment3 = function() {
                    if (c >= comments.length) {
                        endComment();
                        return;
                    }
                    // create comment copy on new task
                    asana_create_story(destination_task, comments[c].text, { success: nextComment });
                };
                nextComment = function() {
                    c++;
                    doComment3();
                };
                endComment = function() {
                    if (callback) {
                        callback();
                    }
                };
                
            doComment();
        }

    }
    
    $('#alert_modal').modal({
        show: false
    });
    
    function runSignin() {
        $("#signin").show();
    }
    
    function asana_create_story(taskid, text, options, loaditem) {
        options.url = 'tasks/' + encodeURIComponent(taskid) + '/stories';
        options.type = 'POST';
        options.data = { text: text };
        return asana(options, loaditem);
    }
    
    function asana_get_stories(taskid, options, loaditem) {
        options.url = 'tasks/' + encodeURIComponent(taskid) + '/stories';
        options.type = 'GET';
        options.data = null;
        return asana(options, loaditem);
    }
    
    function asana_create_task(workspaceid, projectid, task, options, loaditem) {
        options.url = 'tasks';
        if (task['parent']) {
            // set the url to add a subtask, when parent is found on task
            options.url += '/' + encodeURIComponent(task['parent']) + '/subtasks';
        }
        options.type = 'POST';
        if (!options.data) {
            options.data = {
                    name: task.name,
                    completed: task.completed,
                    workspace: workspaceid
            };
            if (projectid) {
                options.data.projects = [ projectid ];
            }
            if (task.due_on) {
                options.data.due_on = task.due_on;
            }
            if (task.notes) {
                options.data.notes = task.notes;
            }
        }
        return asana(options, loaditem);
    }
    
    function asana_get_subtasks(parentTaskId, options, loaditem) {
        options.url = 'tasks/' + encodeURIComponent(parentTaskId) + '/subtasks';
        if (!options.data) {
            options.data = {
                opt_fields: 'name,completed,assignee,assignee_status,due_on,parent,projects,notes'
            };
        }
        return asana(options, loaditem);
    }
    
    function asana_get_tasks(projectid, options, loaditem) {
        options.url = 'projects/' + encodeURIComponent(projectid) + '/tasks';
        if (!options.data) {
            options.data = {
                opt_fields: 'name,completed,assignee,assignee_status,due_on,parent,projects,notes'
            };
        }
        return asana(options, loaditem);
    }
    
    function asana_delete_project(projectid, options, loaditem) {
        options.url = 'projects/' + encodeURIComponent(projectid);
        if (!options.data) {
            options.data = {
                opt_fields: 'name,completed,assignee,assignee_status,due_on,notes'
            };
        }
        options.type = 'DELETE';
        return asana(options, loaditem);
    }
    
    function asana(options, loaditem) {
        options.url = '/api/index.php/Asana/' + options.url;
        options.type = options.type ? options.type : 'GET';
        options.dataType = options.dataType ? options.dataType : 'json';
        options.error = eventPush(
            options.error, 
            function(jqXHR, textStatus, errorThrown) {
                switch (jqXHR.status) {
                    case 401:
                        // not actually logged in anymore, so switch to sign-in view instead
                        $("#errors").append("You must sign into Asana again.<br />");
                        $("#app").hide();
                        runSignin();
                        return false;
                    case 429:
                        // rate limit
                        var retryTime = jqXHR.getResponseHeader('Retry-After');
                        retryTime = retryTime ? retryTime * 1000 : 60000;
                        $('#alert_modal').modal('show');
                        setTimeout(function(ajax) {
                            $('#alert_modal').modal('hide');
                                 $.ajax(ajax);
                            }, retryTime, this);
                        return false;
                }
            });
        var ajax = $.ajax(options);      
        if (loaditem) {
            var loading = $(loaditem);
            loading.addClass('ajaxloading');
            ajax.always(function() {
                loading.removeClass('ajaxloading');
            });
        }
        return ajax;
    }
    
    function eventPush(handler, newitems) {
        if (!handler) {
            handler = [];
        } else if (!$.isArray(handler)) {
            handler = [ handler ];
        }
        if ($.isArray(newitems)) {
            newitems.forEach(function (i) {
                handler.push(i);
            });
        } else {
            handler.push(newitems);
        }
        return handler;
    }
    
});
