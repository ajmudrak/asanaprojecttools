var asanaStatus = null;
var userInfo = null;

$(document).ready(function () {
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
            .change(function () {
                selectProject($(this).val(), $(this).data('obj'));
            });
        
        var workspaces = $("#workspaces")
            .change(function () {
                selectWorkspace($(this).val(), $(this).data('obj'));
            })
            .empty();
                
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
        });
        
        function selectWorkspace(id, obj) {
            localStorage['workspace'] = id;
            projects.empty();
            asana({
                url: 'workspaces/' + encodeURIComponent(id) + '/projects',
                type: 'GET',
                success: function (result) {
                    result.data.forEach(function (p) {
                        $("#template>option.project").clone()
                            .appendTo(projects)
                            .text(p.name)
                            .data('obj', p)
                            .val(p.id);
                    });
                    if (localStorage['project']) {
                        projects.val(localStorage['project']).change();
                    }
                },
                error: function() {
                    $("#errors").append("Server error retrieving workspace data.<br />");
                }
            });
        }

        function selectProject(id, obj) {
            localStorage['project'] = id;
            var tasks = $("#tasks").empty();
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
                    opt_fields: 'name,ompleted,assignee,assignee_status'
                }
            });
        }
        
        function asana(options) {
            return $.ajax({
                url: '/api/index.php/Asana/' + options.url,
                type: options.type ? options.type : 'GET',
                dataType: options.dataType ? options.dataType : 'json',
                data: options.data,
                success: options.success,
                error: [
                    function(jqXHR, textStatus, errorThrown) {
                        switch (jqXHR.status) {
                            case 401:
                                // not actually logged in anymore, so switch to sign-in view instead
                                $("#errors").append("You must sign into Asana again.<br />");
                                $("#app").hide();
                                runSignin();
                                return false;
                        }
                    },
                    options.error
                ]
            });            
        }
    }
    
    function runSignin() {
        $("#signin").show();
    }
});
