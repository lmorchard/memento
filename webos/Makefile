###########################################################################
# Makefile for automating various webOS SDK development tasks
#
# l.m.orchard@pobox.com 
# http://decafbad.com
###########################################################################

APPID=com.decafbad.memento
VERSION=0.0.1

ifeq ($(TARGET),device)
	NOVACOM_ID=$(shell novacom -l | grep castle-linux | head -1 | cut -d' ' -f2)
	DEVICE=usb
	UPDATE_TARGETS=package remove restart install launch
	TESTS_TARGETS=package install launch-tests
else
	NOVACOM_ID=$(shell novacom -l | grep emulator | head -1 | cut -d' ' -f2)
	DEVICE=tcp
	UPDATE_TARGETS=package kill-inspector remove restart install launch launch-inspector
	TESTS_TARGETS=package install launch-tests tail-log
endif

IPK=bin/$(APPID)_$(VERSION)_all.ipk

all: update

docs: FORCE
	jsdoc -c=docs/jsdoc-toolkit.conf

lint: FORCE
	for fn in `find src -type f -not -path '*/vendor/*' -name '*js'`; do \
		echo '----------------------------------------'; \
		echo $$fn; \
		cat $$fn | jslint; \
	done;

FORCE:

package:
	palm-package -o bin src

tests: $(TESTS_TARGETS)

update: $(UPDATE_TARGETS)

tail-log:
	echo '----------------------------------------'; echo; \
	echo 'tail -50 -f /var/log/messages | grep $(APPID)' | novacom -d $(NOVACOM_ID) open tty://

kill:
	-palm-launch -d $(DEVICE) -c $(APPID)

kill-inspector:
	-ps x | grep -i 'palm inspector' | grep -v 'grep' | cut -d' ' -f1 | xargs kill

remove: kill
	-palm-install -d $(DEVICE) -r $(APPID)

restart:
	echo 'killall LunaSysMgr; exit' | novacom -d $(NOVACOM_ID) open tty://; 
	sleep 3;

reboot:
	echo 'reboot; exit' | novacom -d $(NOVACOM_ID) open tty://

install: package
	palm-install -d $(DEVICE) $(IPK)

launch: install
	palm-launch -d $(DEVICE) -i $(APPID)

launch-tests: install
	palm-launch -p "{ testsEnabled:true, runTestsAtLaunch:true }" -d $(DEVICE) $(APPID)

launch-inspector:
	sleep 3; 
	open -g -a Palm\ Inspector;
