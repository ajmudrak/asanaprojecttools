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
                    opt_fields: 'name,color,notes,archived'
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
        
        var copyto_modal = $('#copyto_modal')
            .modal({
                show: false
            });
        var copyto_project_list = copyto_modal.find('.projectlist');
        var copyto_workspace_choice = copyto_modal.find('.workspace_choice');
        var copyto_action = $('#copyto_action')
            .click(function () {
                var workspace = copyto_workspace_choice.val();
                var list = copyto_project_list.data('list');
                alert('starting!');
                copyProjects(list, workspace, function () {
                    alert('done!');
                });
            });
        copyto_workspace_choice.change(function () {
            copyto_action.prop('disabled', $(this).val() ? false : true);
        });

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
        
        function copyProjects(projectlist, destination_workspace, callback) {
            // iterate over projects
            projectlist.forEach(function (project) {
                //   load all tasks for project
                asana_get_tasks(project.id, {
                    success: function (result) {
                        var sourcetasks = result.data;
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
                            success: function (result) {
                                var newproject = result.data;
                                //   iterate over all tasks for project
                                var i = 0;
                                var nextFunc;
                                nextFunc = function(taskresult) {
                                    if (++i >= sourcetasks.length) {
                                        if (callback) {
                                            callback();
                                        }
                                        return;
                                    }
                                    asana_create_task(destination_workspace, newproject.id, sourcetasks[i], {
                                        success: nextFunc
                                    });
                                };
                                //     create new task in new project
                                asana_create_task(destination_workspace, newproject.id, sourcetasks[i], {
                                    success: nextFunc
                                });
                            }
                        });
                        
                    }
                });
            });
        }

    }
    
    $('#alert_modal').modal({
        show: false
    });
    
    function runSignin() {
        $("#signin").show();
    }
    
    function asana_create_task(workspaceid, projectid, task, options, loaditem) {
        options.url = 'tasks';
        options.type = 'POST';
        if (!options.data) {
            options.data = {
                    name: task.name,
                    completed: task.completed,
                    projects: [ projectid ],
                    workspace: workspaceid
            };
            if (task.due_on) {
                options.data.due_on = task.due_on;
            }
            if (task.notes) {
                options.data.notes = task.notes;
            }
        }
        return asana(options, loaditem);
    }
    
    function asana_get_tasks(projectid, options, loaditem) {
        options.url = 'projects/' + encodeURIComponent(projectid) + '/tasks';
        if (!options.data) {
            options.data = {
                opt_fields: 'name,completed,assignee,assignee_status,due_on,notes'
            };
        }
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
