###########################################################################
# Memento webOS application 
#
# l.m.orchard@pobox.com 
# http://decafbad.com
###########################################################################

APPID=com.decafbad.memento
VERSION=0.0.1

NOVACOM_EMU_ID=$(shell novacom -l | grep emulator | head -1 | cut -d' ' -f2)
NOVACOM_DEVICE_ID=$(shell novacom -l | grep castle-linux | head -1 | cut -d' ' -f2)

IPK=$(APPID)_$(VERSION)_all.ipk

all: update-emu

docs: FORCE
	jsdoc -c=docs/jsdoc-toolkit.conf

lint: FORCE
	for fn in `find $(APPID) -type f -name '*js'`; do \
		echo '----------------------------------------'; \
		echo $$fn; \
		cat $$fn | jslint; \
	done;

FORCE:

package:
	palm-package $(APPID)

update-emu: package kill-inspector restart-emu install-app-emu \
	launch-app-emu launch-inspector

kill-app-emu:
	-palm-launch -d tcp -c $(APPID)

kill-inspector:
	-ps x | grep -i 'palm inspector' | grep -v 'grep' | cut -d' ' -f1 | xargs kill

remove-app-emu: kill-app-emu
	-palm-install -d tcp -r $(APPID)

restart-emu:
	echo 'killall LunaSysMgr; exit' | novacom -d $(NOVACOM_EMU_ID) open tty://; 
	sleep 3;

reboot-emu:
	echo 'reboot; exit' | novacom -d $(NOVACOM_EMU_ID) open tty://

install-app-emu: package
	palm-install -d tcp $(IPK)

launch-app-emu: install-app-emu
	palm-launch -d tcp -i $(APPID)

launch-inspector:
	sleep 3; 
	open -g -a Palm\ Inspector;

update-device: package kill-app-device install-app-device launch-app-device

kill-app-device:
	-palm-launch -d usb -c $(APPID)

remove-device-app: kill-app-device
	-palm-install -d usb -r $(APPID)

restart-device:
	echo 'killall LunaSysMgr; exit' | novacom -d $(NOVACOM_DEVICE_ID) open tty://

eboot-device:
	echo 'reboot; exit' | novacom -d $(NOVACOM_DEVICE_ID) open tty://

install-app-device: package
	palm-install -d usb $(IPK)

launch-app-device: install-app-device
	palm-launch -d usb -i $(APPID)
