var fs = require('fs'); 
const { remote } = require('electron');
const { dialog } = remote;

const _newEl = (el, attrs, ...children) => {
    const domEl = document.createElement(el);
    for (let attr in attrs) {
        if (/on[a-z]+/i.test(attr)) {
            domEl[attr] = attrs[attr];
        } else {
            domEl.setAttribute(attr, attrs[attr]);
        }
    }

    children.forEach(child => {
        if (child instanceof HTMLElement) {
            domEl.appendChild(child);
        } else if (child !== undefined && child !== null) {
            domEl.innerHTML = child;
        }
    });
 
    return domEl;
};

const query = q => {
    const nodeList = document.querySelectorAll(q);
    if (nodeList.length === 1) {
        return nodeList[0];
    }

    return nodeList;
};

const emailWrapper = parsedEmail => {
    const fromText = parsedEmail.from.value.map(value => `${value.name} (${value.address})`).join(', ');
    const attachments = parsedEmail.attachments.map(attachment => {
        return _newEl('div', {
            class: 'email-attachment',
            onclick: () => {
                dialog.showSaveDialog((fileName) => {
                    if (fileName === undefined) {
                        return;
                    }
                    fs.writeFileSync(fileName, attachment.content);
                }); 
            }
        }, `&#128206 ${attachment.filename.substring(0, 15)}... (${attachment.size}b - ${attachment.contentType})`);
    });
    const attachmentsEls = _newEl('div', { class: 'email-attachments' }, ...attachments);
    const { date } = parsedEmail;
    const dateText = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    return _newEl('div', { class: 'email-item' }, 
        _newEl('div', {},
            _newEl('div', { class: 'email-header' },
                _newEl('h3', {
                    onclick: evt => {
                        evt.target.parentNode.nextSibling.classList.toggle('shrinked');
                    }
                }, parsedEmail.subject),
                _newEl('p', {}, `&#128197; ${dateText} - De <strong>${fromText}</strong>.`),
                attachmentsEls
            ),
            _newEl('div', { class: 'email-body shrinked' },
                parsedEmail.html || parsedEmail.textAsHtml || parsedEmail.text
            )
        )
    );
};

module.exports = {
    query,
    emailWrapper
};