var httpDownloadPrefix = 'data:text/plain;base64,';

define(["SimpleClient", "clientCode/dropzone"], function(SimpleClient, Dropzone) {
    return function(questionTemplate, answerTemplate) {
        var simpleClient = new SimpleClient.SimpleClient({questionTemplate: questionTemplate, answerTemplate: answerTemplate});

        function key(s) {
            return s.replace(/\./g, '_');
        }

        function getSubmittedFile(name) {
            return simpleClient.submittedAnswer.get(key(name))
        }

        function uploadStatus() {
            var $uploadStatus = $('<ul></ul>');
            var requiredFiles = simpleClient.params.get('requiredFiles');

            _(requiredFiles).each(function(file) {
                var $item = $('<li></li>');
                $uploadStatus.append($item);
                $item.append('<code>' + encodeURIComponent(file) + '</code> - ');
                var fileData = getSubmittedFile(file);
                if (!fileData) {
                    $item.append('not uploaded');
                } else {
                    var $preview = $('<pre><code></code></pre>');
                    $preview.find('code').text(window.atob(fileData));
                    $preview.hide();
                    var $toggler = $('<a href="#">view</a>');
                    $toggler.on('click', function(e) {
                        $preview.toggle();
                        e.preventDefault();
                        return false;
                    });
                    $item.append($toggler);
                    $item.append($preview);
                }
            });

            return $uploadStatus;
        }

        function initializeTemplate() {
            var $fileUpload = $('#fileUpload');
            $fileUpload.html('');

            var $dropTarget = $('<div class="dropzone"><div class="dz-message">Drop files here or click to upload.<br/><small>Only the files listed below will be accepted&mdash;others will be silently ignored.</small></div></div>');
            var $style = $('<style scoped>' + 
                    '.dropzone { position: relative; min-height: 15ex; border-radius: 4px; background-color: #FAFDFF; border: 1px solid #D9EDF7; }' + 
                    '.dropzone.dz-clickable { cursor: pointer; }' + 
                    '.dropzone.dz-drag-hover { background-color: #D9EDF7; border-color: #AED3E5; }' + 
                    '.dz-message { position: absolute; top: 50%; transform: translateY(-50%); text-align: center; width: 100%; }' + 
                    '</style>'
                    );

            var requiredFiles = simpleClient.params.get('requiredFiles');

            var dropzone = $dropTarget.dropzone({
                url: '/none',
                autoProcessQueue: false,
                accept: function(file, done) {
                    if (_.contains(requiredFiles, file.name)) {
                        done();
                        return;
                    }
                    done('invalid file');
                },
                addedfile: function(file) {
                    if (!_.contains(requiredFiles, file.name)) {
                        return;
                    }
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var dataUrl = e.target.result;

                        var commaSplitIdx = dataUrl.indexOf(',');

                        // Store the data as base64 encoded data
                        var base64FileData = dataUrl.substring(commaSplitIdx + 1);
                        simpleClient.submittedAnswer.set(key(file.name), base64FileData);
                    };

                    reader.readAsDataURL(file);
                },
            });

            $fileUpload.append($style);
            $fileUpload.append($dropTarget);
            $fileUpload.append('<div class="fileUploadStatus" style="margin-top: 1ex;"></div>');

            updateTemplate();
        }

        function updateTemplate() {
            $('#fileUpload .fileUploadStatus').html('');
            $('#fileUpload .fileUploadStatus').append(uploadStatus());
        }

        simpleClient.on('renderQuestionFinished', function() {
            simpleClient.submittedAnswer.bind('change', function() {
                updateTemplate();
            });

            var requiredFiles = simpleClient.params.get('requiredFiles');
            _(requiredFiles).each(function(file) {
                simpleClient.addOptionalAnswer(key(file));
            });

            initializeTemplate();
        });

        return simpleClient;
    };
});

if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    alert('Warning: Your browser does not fully support HTML5 file upload operations.' +
    'Please use a more current browser or you may not be able to complete this question.')
}
