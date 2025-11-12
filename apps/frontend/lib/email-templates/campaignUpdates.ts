const getEmailFooter = (): string => {
    const footerText = process.env.EMAIL_FOOTER_TEXT || 'Thank you for supporting campaigns on MWG Crowdfunding Platform';
    const blockExplorer = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com';

    return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
      <p>${footerText}</p>
      <p style="margin-top: 10px;">
        <a href="${blockExplorer}" style="color: #3b82f6; text-decoration: none;">View on Block Explorer</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        To unsubscribe from these updates, please contact support.
      </p>
    </div>
  `;
};

export const welcomeDonorEmail = (
    campaignTitle: string,
    campaignId: string,
    donationAmount: string
): string => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Thank You for Your Support! 🎉</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            You've successfully donated <strong>${donationAmount} BNB</strong> to:
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 20px;">${campaignTitle}</h2>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Campaign ID: ${campaignId}</p>
          </div>
          
          <h3 style="color: #1f2937; margin-top: 30px;">What's Next?</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>You'll receive MWG-DT tokens equivalent to your donation</li>
            <li>Use your tokens to vote on milestone completions</li>
            <li>We'll send you updates when:
              <ul style="margin-top: 10px;">
                <li>New milestones are created</li>
                <li>Milestones are completed and approved</li>
                <li>The campaign reaches important goals</li>
              </ul>
            </li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com'}/address/${campaignId}" 
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Campaign
            </a>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
};

export const milestoneCreatedEmail = (
    campaignTitle: string,
    campaignId: string,
    milestoneNumber: number,
    votingDeadline: string
): string => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Milestone Ready for Voting! 🎯</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            A new milestone has been submitted for the campaign you're supporting:
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #10b981; font-size: 20px;">${campaignTitle}</h2>
            <p style="margin: 10px 0; color: #1f2937; font-size: 16px;">
              <strong>Milestone ${milestoneNumber}</strong>
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Voting deadline: ${votingDeadline}
            </p>
          </div>
          
          <h3 style="color: #1f2937; margin-top: 30px;">Your Vote Matters!</h3>
          <p style="color: #4b5563;">
            As a donor, you have voting power based on your contribution. 
            Review the milestone details and cast your vote to approve or decline the completion.
          </p>
          
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46; font-weight: 600;">
              ⏰ Voting Period: 14 days
            </p>
            <p style="margin: 5px 0 0 0; color: #047857; font-size: 14px;">
              Make sure to vote before the deadline!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com'}/address/${campaignId}" 
               style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Vote on Milestone
            </a>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
};

export const milestoneApprovedEmail = (
    campaignTitle: string,
    campaignId: string,
    milestoneNumber: number,
    approvalPercentage: string
): string => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Milestone Approved! ✅</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Great news! A milestone for the campaign you're supporting has been approved by the community:
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #3b82f6; font-size: 20px;">${campaignTitle}</h2>
            <p style="margin: 10px 0; color: #1f2937; font-size: 16px;">
              <strong>Milestone ${milestoneNumber}</strong>
            </p>
            <p style="margin: 0; color: #10b981; font-size: 18px; font-weight: bold;">
              ${approvalPercentage}% Approval
            </p>
          </div>
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; font-weight: 600;">
              ✨ The campaign creator can now withdraw funds for this milestone
            </p>
            <p style="margin: 5px 0 0 0; color: #1e3a8a; font-size: 14px;">
              Your vote helped make this possible!
            </p>
          </div>
          
          <p style="color: #4b5563;">
            Thank you for participating in the governance of this campaign. 
            Your engagement helps ensure accountability and transparency.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com'}/address/${campaignId}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Campaign Progress
            </a>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
};

export const campaignEndedEmail = (
    campaignTitle: string,
    campaignId: string,
    totalRaised: string,
    goalAchieved: boolean
): string => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${goalAchieved ? '#f59e0b' : '#6b7280'} 0%, ${goalAchieved ? '#d97706' : '#4b5563'} 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Campaign Ended ${goalAchieved ? '🎉' : '📊'}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            The campaign you supported has now ended:
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: ${goalAchieved ? '#f59e0b' : '#6b7280'}; font-size: 20px;">${campaignTitle}</h2>
            <p style="margin: 10px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
              Total Raised: ${totalRaised} BNB
            </p>
            ${goalAchieved ?
            '<p style="margin: 0; color: #10b981; font-weight: bold;">✅ Funding Goal Achieved!</p>' :
            '<p style="margin: 0; color: #6b7280;">Goal not fully reached</p>'
        }
          </div>
          
          <h3 style="color: #1f2937; margin-top: 30px;">Thank You for Your Support!</h3>
          <p style="color: #4b5563;">
            Your contribution helped make this campaign possible. 
            ${goalAchieved ?
            'The campaign successfully reached its funding goal thanks to donors like you!' :
            'Even though the full goal wasn\'t reached, your support made a difference.'
        }
          </p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
              💎 You still hold your MWG-DT tokens
            </p>
            <p style="margin: 5px 0 0 0; color: #78350f; font-size: 14px;">
              These tokens represent your support and can be used for voting in other campaigns
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com'}/address/${campaignId}" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Final Campaign Details
            </a>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
};
