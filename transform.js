var _ = require('lodash');
module.exports = function (fileInfo, api, options) {
    // Transform the file to source here
    // ...
    // return the changed source

    const j = api.jscodeshift,
        root = j(fileInfo.source);

    var requestsInformation = [];

    function requestDetails() {
        var self = this;
        self.name = '';
        self.dataType = '';
        self.url = '';
        self.parameters = [];
    }

    function hasJQueryDependencyImported() {
        const checkJQueryLiteral = root.find(j.Literal, { value: 'jquery' }),
            checkJQueryParameter = root.find(j.Identifier, { name: '$' });
        return checkJQueryLiteral.length !== 0 && checkJQueryParameter.length !== 0;
    }
    
    function collectRequestInfo(requestDefinition) {
        var currentRequest = j(requestDefinition),
            requestInfo = new requestDetails(),
            url = currentRequest.find(j.ObjectExpression).get(0).parentPath.value.properties[1],
            returnExpressions = root.find(j.ReturnStatement,
                {
                    argument: {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            object: {
                                type: 'Identifier',
                                name: 'amplify'
                            }
                        }
                    }
                });

        requestInfo.name = currentRequest.find(j.Literal).get(0).parentPath.value.value;
        requestInfo.dataType = currentRequest.find(j.ObjectExpression).get(0).parentPath.value.properties[0].value.value;
        requestInfo.url = url.value.object.object.name + '.' + url.value.object.property.name + '.' + url.value.property.name;
        returnExpressions.forEach(function (amplifyRequest) {
            var requestDetails = amplifyRequest,
                properties;
            if (requestDetails.value.argument.arguments[0].value === requestInfo.name) {
                properties = requestDetails.value.argument.arguments[1].properties;

                properties.forEach(function (property) {
                    requestInfo.parameters.push(property.value.name);
                });
            }
        });

        requestsInformation.push(requestInfo);
    }

    const amplifyLiteral = root.find(j.Literal, { value: 'amplify' });
    amplifyLiteral.remove();

    const amplifyRequestDeferredLiteral = root.find(j.Literal, { value: 'amplify.request.deferred' });
    amplifyRequestDeferredLiteral.remove();

    const amplifyParameters = root.find(j.Identifier, { name: 'amplify' });
    amplifyParameters.forEach(function (path) {
        if (path.parentPath.parentPath.value.type === 'FunctionExpression' && path.parentPath.parentPath.value.id === null) {
            j(path).remove();
        }
    });

    var allAmplifyRequestDefinitions = root.find(
        j.ExpressionStatement,
        {
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    object: {
                        type: 'MemberExpression',
                        object: {
                            type: 'Identifier',
                            name: 'amplify'
                        }
                    }
                }
            }
        }
    );

    if (allAmplifyRequestDefinitions.length) {
        allAmplifyRequestDefinitions.forEach(function (ampReqDef) {
            collectRequestInfo(ampReqDef);
        });
    }

    // Do this after collecting information about the requests to be built
    allAmplifyRequestDefinitions.remove();

    if (!hasJQueryDependencyImported()) {
        var accessDefineBlock = root.find(j.CallExpression, {
            callee: {
                type: 'Identifier',
                name: 'define'
            }
        });

        accessDefineBlock.forEach(function (expression) {
            var dependencies = expression.value.arguments[0].elements,
                depdendenciesArguments = expression.value.arguments[1].params,
                jqueryDependency = j.literal('jquery'),
                jqueryArgument = j.identifier('$')

            // Should be at index of last argument + 1
            dependencies[depdendenciesArguments.length + 1] = jqueryDependency;
            depdendenciesArguments[depdendenciesArguments.length + 1] = jqueryArgument;
        });
    }

    return root.toSource({quote: 'single'});

    /*j(source)
     .find(j.Identifier)
     .forEach(function (path) {
     if (path.node.name === 'define') {
     if (path.parentPath.value.type === 'CallExpression') {
     defineArguments = path.parentPath.value.arguments;
     defineArguments.forEach(function (argument) {
     if (argument.type === 'ArrayExpression') {
     amdDependencies = argument.elements;
     jQueryImported = hasJQueryDependencyImported(amdDependencies);
     amdDependencies.forEach(function (dependency) {
     if (dependency.type === 'Literal') {
     if(dependency.value === 'amplify') {

     }
     }
     });
     }
     });
     }
     }
     })
     .toSource();*/
};
