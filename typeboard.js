riot.tag2('typeboard', '<div class="container" onclick="{setFocus}"> <span><b> Keyboard Master </b></span> </div> <div class="articles" onclick="{setFocus}"> <span class="{getCursorClass(i)}" each="{i in article}">{i.letter}</span> </div> <input id="InputField" oninput="{change}"> <input id="UserField" placeholder="Enter your name here." onkeyup="{updateUser}"> <button onclick="{begin}" disabled="{selectedContestID===undefined}">Begin</button> <span>Timer: {formatTime(time)}</span> <select onchange="{handleContestChangedAction}"> <option each="{contests}" riot-value="{id}">{content}</option> </select> <ul> <li each="{userTimes}"> {name} {time} </li> </ul> <input id="focus-me">', '', '', function(opts) {
    this.user = null;
    this.current = 0;
    this.time = 0
    this.allUsers = [];
    this.article =
    this.userTimes = [];
    this.contests = [];
    this.selectedContestID = undefined;

    setTimeout(() => {
      this.reloadContests()
    }, 100);

    this.formatTime = function(duration) {
      var milliseconds = parseInt((duration % 1000) / 100),
          seconds = parseInt((duration / 1000) % 60),
          minutes = parseInt((duration / (1000 * 60)) % 60),

      minutes = (minutes < 10) ? "0" + minutes : minutes;
      seconds = (seconds < 10) ? "0" + seconds : seconds;

      return  minutes + ":" + seconds + "." + milliseconds;
    }.bind(this)

    this.reloadContests = function() {
      firebase.database().ref(`contests`).on('value', (snapshot) => {
        const contests =
          Object.keys(snapshot.val()).map((key) => snapshot.val()[key]).filter((val) => val);
        if (!this.contests.length) {
          setTimeout(() => {
            this.handleContestChanged(contests[0].id);
          }, 100);
        }
        this.update({
          contests,
          selectedContestID: contests[0].id,
        });
      });
    }.bind(this)

    this.reloadTime = function(contestID) {
      firebase.database().ref(`userTimes/${contestID}`).on('value', (snapshot) => {
        const userTimes = Object.keys(snapshot.val())
          .map((key) => ({ name: key, time: parseInt(snapshot.val()[key].time) }))
          .filter(({ time }) => time)
          .filter((_, idx) => idx < 10);
        userTimes.sort((a, b) => - a.time + b.time);
        this.userTimes = userTimes;
        console.log({ userTimes })
        this.update({ userTimes });
      });
    }.bind(this)

    this.handleContestChangedAction = function(e) {
      this.handleContestChanged(e.target.value);
    }.bind(this)

    this.handleContestChanged = function(contestID) {
      this.update({
        selectedContestID: contestID,
        article:
          this.contests
          .find(cont => cont.id == contestID)
          .content
          .split('').map((letter, index) => ({ letter, index, check: '' })),
      })
      this.reloadTime(contestID);
    }.bind(this)

    this.tick = function() {
      this.update({ time: this.time + 10 })
    }.bind(this)

    this.begin = function() {
      if (!this.user) {
        return;
      }
      this.setFocus();
      this.timer = setInterval(this.tick, 10)
      document.getElementById('UserField').value = ''
    }.bind(this)

    this.updateUser = function(e) {
      this.user = e.target.value;
    }.bind(this)

    this.setFocus = function(){
      if (!this.user) {
        return;
      }
      document.getElementById('InputField').focus()
    }.bind(this)

    this.finish = function() {
      document.getElementById('InputField').value = ''
      document.getElementById('focus-me').focus();
      document.getElementById('focus-me').blur();
      this.writeUserData(this.selectedContestID, this.user, this.time);
      clearInterval(this.timer);
      this.timer = undefined
    }.bind(this)

    this.getCursorClass = function(ar) {
      const idx = this.article.indexOf(ar);
      const userInput = document.getElementById('InputField').value;
      const cursorClass = (this.timer && (idx === userInput.length)) ? 'blink' : '';
      const colorClass = idx < userInput.length ? ((ar.letter === userInput[idx]) ? 'green' : 'red') : '';
      ar.cursorClass = `${cursorClass} ${colorClass}`;
      return `${cursorClass} ${colorClass}`;
    }.bind(this)

    this.change = function(e) {
      console.log('change', { e })
      const userInput = e.target.value.split('');
      this.article.forEach((ar, idx) => {
      });

      if (userInput.length >= this.article.length) {
        this.finish();
      }
    }.bind(this)

    this.writeUserData = function(contestID, userId, time) {
      console.log('writeUserData', { userId, time });
      firebase.database().ref(`userTimes/${contestID}/${userId}`).set({
        time,
      });
    }.bind(this)

});