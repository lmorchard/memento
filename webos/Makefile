###########################################################################
# Memento webOS application 
#
# l.m.orchard@pobox.com 
# http://decafbad.com
###########################################################################

APPID=com.decafbad.memento
VERSION=0.0.1

IPK=$(APPID)_$(VERSION)_all.ipk

all: update-emu

package:
	palm-package $(APPID)

#update-emu: package kill-emu remove-emu install-emu launch-emu
update-emu: package install-emu launch-emu

kill-emu:
	-palm-launch -d tcp -c $(APPID)

remove-emu: kill-emu
	-palm-install -d tcp -r $(APPID)

install-emu: package
	palm-install -d tcp $(IPK)

launch-emu: install-emu
	palm-launch -d tcp -i $(APPID)

#update-device: package kill-device remove-device install-device launch-device
update-device: package install-device launch-device

kill-device:
	-palm-launch -d usb -c $(APPID)

remove-device: kill-device
	-palm-install -d usb -r $(APPID)

install-device: package
	palm-install -d usb $(IPK)

launch-device: install-device
	palm-launch -d usb -i $(APPID)
