import { PANGEA_OBJ } from "@/lib/config/pangea";
import { connectToDB } from "@/lib/config/mongoose";
import Invitation from "@/lib/model/invitation.model";
import { PangeaConfig, AuthNService } from "pangea-node-sdk";
import { baseURL } from "@/lib/helpers";

const InvitationOrgHandler = async (request: Request) => {
  const { domain, token } = PANGEA_OBJ;
  const CB_URI = baseURL!;

  const config = new PangeaConfig({ domain });
  const authn = new AuthNService(token, config);

  connectToDB();
  try {
    switch (request.method) {
      case "GET":
        try {
          const { searchParams } = new URL(request.url);
          const orgId = searchParams.get("orgId");

          const foundInvitation = await Invitation.find({ orgId });

          if (!foundInvitation)
            return Response.json({
              success: false,
              data: null,
              msg: "No invitation found.",
            });

          return Response.json({
            data: foundInvitation,
            success: true,
            msg: "Fetched Successfully.",
          });
        } catch (error) {
          console.log(error);
        }

      case "POST":
        try {
          const { invite } = await request.json();

          if (!invite)
            return Response.json({
              data: null,
              success: false,
              msg: "invite is undefined.",
            });

          if (!invite.orgId)
            return Response.json({
              data: null,
              success: false,
              msg: "Org ID is needed.",
            });

          if (!invite.email)
            return Response.json({
              data: null,
              success: false,
              msg: "Email is needed.",
            });

          // Check if the user has already been invited to the same organization
          const existingInvitation = await Invitation.findOne({
            orgId: invite.orgId,
            email: invite.email,
          });

          if (existingInvitation) {
            return Response.json({
              success: false,
              data: null,
              msg: "User has already been invited to this organization.",
            });
          }

          const sendInvite = await authn.user.invite({
            inviter: "rockyessel76@gmail.com",
            email: invite.email,
            callback: CB_URI,
            state: invite.orgId,
          });

          // console.log("sendInvite: ", sendInvite.result);

          if (sendInvite.result.id) {
            // Save the invitation record if the invitation is successfully sent
            const insertRecord = await Invitation.create({
              ...invite,
            });

            // console.log("insertRecord: ", insertRecord);

            if (insertRecord)
              return Response.json({
                success: true,
                data: null,
                msg: "Invite sent successfully.I",
              });
          }
        } catch (error) {
          console.log(error);
          return Response.json({
            success: false,
            error: "Something went wrong.",
          });
        }

      default:
        return Response.json({ success: false, error: "Method not allowed." });
    }
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" });
  }
};

export { InvitationOrgHandler as POST, InvitationOrgHandler as GET };
